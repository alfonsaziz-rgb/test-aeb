export interface PatchValues {
  minSdk: number;
  targetSdk: number;
  versionCode: number;
  versionName: string;
  appName: string;
  appHeader: string;
  accessibilityLabel: string;
  footerText: string;
}

export const STARTER_PATCH_VALUES: PatchValues = {
  minSdk: 29,
  targetSdk: 31,
  versionCode: 21000,
  versionName: '2.1',
  appName: 'AEB Manager',
  appHeader: 'AEB Manager For DiLink 4.0',
  accessibilityLabel: 'AEB Helper',
  footerText: 'V2.1 - DiLink 4.0',
};

export const UPSTREAM_DEFAULT_VALUES: PatchValues = {
  minSdk: 31,
  targetSdk: 31,
  versionCode: 19000,
  versionName: '2.0',
  appName: 'AEB Manager',
  appHeader: 'AEB Manager For Dilink 5.0',
  accessibilityLabel: 'AEB Helper',
  footerText: 'V2.0 - By MK',
};

export const LOCKED_INVARIANTS = {
  repoUrl: 'https://github.com/EngMohamedKhamis/BYD-AEB-Manager.git',
  namespace: 'com.byd.aebtoggle',
  applicationId: 'com.mk.aebmanager',
  compileSdk: 31,
  agpVersion: '8.1.0',
  gradleVersion: '8.9',
  jdkVersion: '17',
  readTransaction: 'service call autoservice 5 i32 1038 i32 852492332',
  writeTransactionPrimary: 'service call autoservice 6 i32 1038 i32 852492332 i32 <val>',
  writeTransactionSecondary: 'service call autoservice 6 i32 1038 i32 944767020 i32 <val>',
  apkOutputPath: 'app/build/outputs/apk/debug/app-debug.apk',
};

const UPSTREAM_BUILD_GRADLE_HEADER = `plugins {
    id 'com.android.application'
}

def props = new Properties()
def localPropsFile = rootProject.file('local.properties')
if (localPropsFile.exists()) {
    localPropsFile.withInputStream { stream ->
        props.load(stream)
    }
}

android {
    namespace 'com.byd.aebtoggle'
    compileSdk 31
`;

const UPSTREAM_BUILD_GRADLE_FOOTER = `    def keystorePath = props.getProperty('COMMUNITY_STORE_FILE', '')
    def communityKeystore = keystorePath ? file(keystorePath) : null
    def hasKeystore = (communityKeystore != null && communityKeystore.exists())

    signingConfigs {
        if (hasKeystore) {
            release {
                storeFile communityKeystore
                storePassword props.getProperty('COMMUNITY_STORE_PASSWORD', '')
                keyAlias props.getProperty('COMMUNITY_KEY_ALIAS', '')
                keyPassword props.getProperty('COMMUNITY_KEY_PASSWORD', '')
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            shrinkResources false
            if (hasKeystore) {
                signingConfig signingConfigs.release
            } else {
                signingConfig signingConfigs.debug
            }
        }

        aggressiveRelease {
            initWith release
            minifyEnabled true
            shrinkResources true
            if (hasKeystore) {
                signingConfig signingConfigs.release
            } else {
                signingConfig signingConfigs.debug
            }
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-aggressive.pro'

            matchingFallbacks = ['release']
        }
    }


    buildFeatures {
        buildConfig true
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    // No external dependencies - keeping it stealth and small
    // Pure-Java logic that is tested without Android lives in :core
    implementation project(':core')
}

// ---------------------------------------------------------------------------
// Refactor S7: checks that run by themselves.
//  - The core self-test runs before every build (a failed check fails the build).
//  - Every release-type APK is checked by tools/verify_apks.ps1 right after it is assembled. The
//    verify output plus the APK's SHA-256, version and git commit are written to
//    build-manifest-<variant>.txt next to the APK. A failed check fails the build.
//    Windows only (PowerShell); elsewhere the check is skipped with a warning.
// Prints no key material (verify_apks.ps1 never does).
// ---------------------------------------------------------------------------
tasks.matching { it.name == 'preBuild' }.configureEach { dependsOn ':core:selfTest' }

android.applicationVariants.all { variant ->
    if (variant.buildType.debuggable) return
    def verifyTask = tasks.register("verify\${variant.name.capitalize()}Apk") {
        group = 'verification'
        description = "Runs tools/verify_apks.ps1 on the \${variant.name} APK and writes build-manifest-\${variant.name}.txt"
        doLast {
            File apk = variant.outputs.first().outputFile
            if (!apk.exists()) throw new GradleException("verify: \${apk} was not built")
            String sha = java.security.MessageDigest.getInstance('SHA-256').digest(apk.bytes).encodeHex().toString().toUpperCase()
            String commit = 'unknown'
            try {
                def p = ['git', '--no-optional-locks', '-C', rootDir.absolutePath, 'rev-parse', '--short', 'HEAD'].execute()
                String out = p.inputStream.text.trim()
                if (p.waitFor() == 0 && out) commit = out
            } catch (Exception ignored) {
            }

            String report
            int exit
            if (System.getProperty('os.name').toLowerCase().contains('windows')) {
                def buffer = new ByteArrayOutputStream()
                def result = project.exec {
                    commandLine 'powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
                            rootProject.file('tools/verify_apks.ps1').absolutePath,
                            '-ProjectRoot', rootProject.projectDir.absolutePath, // $PSScriptRoot is empty in param defaults under -File
                            '-SdkDir', project.android.sdkDirectory.absolutePath,
                            '-Apk', apk.absolutePath,
                            '-ExpectedVersionCode', "\${variant.versionCode}",
                            '-ExpectedVersionName', "\${variant.versionName}"
                    standardOutput = buffer
                    errorOutput = buffer
                    ignoreExitValue = true
                }
                report = buffer.toString('UTF-8')
                exit = result.exitValue
            } else {
                report = 'verify_apks.ps1 skipped (needs Windows PowerShell)'
                exit = 0
                logger.warn("verify: \${report}")
            }

            File manifest = new File(apk.parentFile, "build-manifest-\${variant.name}.txt")
            manifest.setText(
                    "application: \${variant.applicationId}\\n" +
                    "variant: \${variant.name}\\n" +
                    "versionName: \${variant.versionName}\\n" +
                    "versionCode: \${variant.versionCode}\\n" +
                    "commit: \${commit}\\n" +
                    "apk: \${apk.name}\\n" +
                    "size: \${apk.length()}\\n" +
                    "sha256: \${sha}\\n" +
                    "verify_apks.ps1 exit code: \${exit}\\n\\n" +
                    report, 'UTF-8')
            logger.lifecycle("verify: \${apk.name} \${exit == 0 ? 'PASS' : 'FAIL'} (manifest: \${manifest})")
            if (exit != 0) throw new GradleException("verify_apks.ps1 FAILED for \${apk.name}; see \${manifest}")
        }
    }
    variant.assembleProvider.configure { finalizedBy verifyTask }
}
`;

export function formatDefaultConfigBlock(values: PatchValues): string {
  return `    defaultConfig {
        applicationId "${LOCKED_INVARIANTS.applicationId}"
        minSdk ${values.minSdk}
        targetSdk ${values.targetSdk}
        versionCode ${values.versionCode}
        versionName "${values.versionName}"

        resValue "string", "app_name", "${values.appName}"
        resValue "string", "app_header", "${values.appHeader}"
        resValue "string", "accessibility_label", "${values.accessibilityLabel}"
        resValue "string", "footer_text", "${values.footerText}"
        buildConfigField "String", "APP_DISPLAY_NAME", "\\"AEB Manager\\""
    }`;
}

export function buildPatchedBuildGradle(values: PatchValues = STARTER_PATCH_VALUES): string {
  return `${UPSTREAM_BUILD_GRADLE_HEADER}
${formatDefaultConfigBlock(values)}

${UPSTREAM_BUILD_GRADLE_FOOTER}`;
}

export function buildUnifiedPatch(values: PatchValues = STARTER_PATCH_VALUES): string {
  return `diff --git a/app/build.gradle b/app/build.gradle
--- a/app/build.gradle
+++ b/app/build.gradle
@@ -16,13 +16,13 @@ android {
 
     defaultConfig {
         applicationId "com.mk.aebmanager"
-        minSdk 31
-        targetSdk 31
-        versionCode 19000
-        versionName "2.0"
+        minSdk ${values.minSdk}
+        targetSdk ${values.targetSdk}
+        versionCode ${values.versionCode}
+        versionName "${values.versionName}"
 
         resValue "string", "app_name", "AEB Manager"
-        resValue "string", "app_header", "AEB Manager For Dilink 5.0"
+        resValue "string", "app_header", "${values.appHeader}"
         resValue "string", "accessibility_label", "AEB Helper"
-        resValue "string", "footer_text", "V2.0 - By MK"
+        resValue "string", "footer_text", "${values.footerText}"
         buildConfigField "String", "APP_DISPLAY_NAME", "\\"AEB Manager\\""
     }
`;
}

export function buildWindowsScript(values: PatchValues = STARTER_PATCH_VALUES): string {
  return `$ErrorActionPreference = 'Stop'

# BYD AEB Manager — DiLink 4.0 (Android 10 / API ${values.minSdk}) Starter Build Script
# Requires: Git, JDK 17, Android SDK Platform 31

if (-not (Test-Path "BYD-AEB-Manager")) {
    git clone ${LOCKED_INVARIANTS.repoUrl}
}

Set-Location "BYD-AEB-Manager"

$gradleFile = "app\\build.gradle"
$content = Get-Content $gradleFile -Raw

$oldBlock = @'
        minSdk 31
        targetSdk 31
        versionCode 19000
        versionName "2.0"

        resValue "string", "app_name", "AEB Manager"
        resValue "string", "app_header", "AEB Manager For Dilink 5.0"
        resValue "string", "accessibility_label", "AEB Helper"
        resValue "string", "footer_text", "V2.0 - By MK"
'@

$newBlock = @'
        minSdk ${values.minSdk}
        targetSdk ${values.targetSdk}
        versionCode ${values.versionCode}
        versionName "${values.versionName}"

        resValue "string", "app_name", "${values.appName}"
        resValue "string", "app_header", "${values.appHeader}"
        resValue "string", "accessibility_label", "${values.accessibilityLabel}"
        resValue "string", "footer_text", "${values.footerText}"
'@

if ($content -notlike "*minSdk ${values.minSdk}*") {
    $content = $content.Replace($oldBlock, $newBlock)
    [System.IO.File]::WriteAllText((Resolve-Path $gradleFile), $content)
    Write-Host "Applied DiLink 4.0 starter patch to app\\build.gradle" -ForegroundColor Cyan
}

cmd.exe /c "gradlew.bat :app:assembleDebug"

$apk = "app\\build\\outputs\\apk\\debug\\app-debug.apk"
if (Test-Path $apk) {
    Write-Host "Debug APK built: $apk" -ForegroundColor Green
} else {
    throw "Build completed without generating $apk"
}
`;
}

export function buildUnixScript(values: PatchValues = STARTER_PATCH_VALUES): string {
  return `#!/usr/bin/env bash
set -euo pipefail

# BYD AEB Manager — DiLink 4.0 (Android 10 / API ${values.minSdk}) Starter Build Script
# Requires: Git, JDK 17, Android SDK Platform 31

if [ ! -d "BYD-AEB-Manager" ]; then
  git clone ${LOCKED_INVARIANTS.repoUrl}
fi

cd BYD-AEB-Manager

python3 - <<'PY'
from pathlib import Path

p = Path("app/build.gradle")
text = p.read_text(encoding="utf-8")

old_block = """        minSdk 31
        targetSdk 31
        versionCode 19000
        versionName "2.0"

        resValue "string", "app_name", "AEB Manager"
        resValue "string", "app_header", "AEB Manager For Dilink 5.0"
        resValue "string", "accessibility_label", "AEB Helper"
        resValue "string", "footer_text", "V2.0 - By MK\""""

new_block = """        minSdk ${values.minSdk}
        targetSdk ${values.targetSdk}
        versionCode ${values.versionCode}
        versionName "${values.versionName}"

        resValue "string", "app_name", "${values.appName}"
        resValue "string", "app_header", "${values.appHeader}"
        resValue "string", "accessibility_label", "${values.accessibilityLabel}"
        resValue "string", "footer_text", "${values.footerText}\""""

if old_block in text:
    p.write_text(text.replace(old_block, new_block, 1), encoding="utf-8")
    print("Applied DiLink 4.0 starter patch to app/build.gradle")
elif "minSdk ${values.minSdk}" in text:
    print("DiLink 4.0 patch already present in app/build.gradle")
else:
    raise SystemExit("Expected upstream defaultConfig block not found in app/build.gradle")
PY

chmod +x gradlew
./gradlew :app:assembleDebug

echo "Debug APK ready at: app/build/outputs/apk/debug/app-debug.apk"
`;
}

export function buildGithubWorkflow(values: PatchValues = STARTER_PATCH_VALUES): string {
  return `name: Build BYD AEB Manager (DiLink 4.0 Debug APK)

on:
  workflow_dispatch:
  push:
    branches: [ main, master ]

jobs:
  build-debug-apk:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'

      - name: Accept Android SDK licenses
        run: yes | "\${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null || true

      - name: Prepare upstream BYD-AEB-Manager source
        run: |
          if [ ! -f "app/build.gradle" ]; then
            git clone ${LOCKED_INVARIANTS.repoUrl} upstream
            echo "BUILD_DIR=upstream" >> "$GITHUB_ENV"
          else
            echo "BUILD_DIR=." >> "$GITHUB_ENV"
          fi

      - name: Apply DiLink 4.0 starter patch to app/build.gradle
        run: |
          cd "\${BUILD_DIR}"
          if [ -f "../dilink4-starter.patch" ] && git apply --check "../dilink4-starter.patch" 2>/dev/null; then
            git apply "../dilink4-starter.patch"
            exit 0
          fi
          python3 - <<'PY'
          from pathlib import Path
          p = Path("app/build.gradle")
          text = p.read_text(encoding="utf-8")
          replacements = [
              ("minSdk 31", "minSdk ${values.minSdk}"),
              ("targetSdk 31", "targetSdk ${values.targetSdk}"),
              ("versionCode 19000", "versionCode ${values.versionCode}"),
              ('versionName "2.0"', 'versionName "${values.versionName}"'),
              ('resValue "string", "app_header", "AEB Manager For Dilink 5.0"', 'resValue "string", "app_header", "${values.appHeader}"'),
              ('resValue "string", "footer_text", "V2.0 - By MK"', 'resValue "string", "footer_text", "${values.footerText}"'),
          ]
          for old, new in replacements:
              if old in text:
                  text = text.replace(old, new, 1)
          assert "minSdk ${values.minSdk}" in text, "Patch verification failed"
          p.write_text(text, encoding="utf-8")
          PY

      - name: Build Debug APK
        run: |
          cd "\${BUILD_DIR}"
          chmod +x gradlew
          ./gradlew :app:assembleDebug

      - name: Upload app-debug.apk artifact
        uses: actions/upload-artifact@v4
        with:
          name: byd-aeb-dilink4-debug-apk
          path: \${{ env.BUILD_DIR }}/app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
`;
}

export type AuditStatus = 'compatible' | 'locked' | 'unverified';

export interface AuditItem {
  id: string;
  file: string;
  lines: string;
  apiSymbol: string;
  requiredApi: string;
  status: AuditStatus;
  snippet: string;
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
}

export const AUDIT_ITEMS: AuditItem[] = [
  {
    id: 'gradle-sdk',
    file: 'app/build.gradle',
    lines: '14–28',
    apiSymbol: 'minSdk 31 -> 29 / compileSdk 31',
    requiredApi: 'API 29',
    status: 'compatible',
    snippet: 'minSdk 29 / targetSdk 31 / versionCode 21000 / versionName "2.1"',
    titleAr: 'تخفيض الحد الأدنى لنظام Android إلى API 29',
    titleEn: 'Lower minSdk to Android 10 (API 29)',
    detailAr:
      'الإصدار الأصلي يفرض minSdk 31 (Android 12) مما يمنع الحزمة من التثبيت على وحدات DiLink 4.0 العاملة بنظام Android 10. الإبقاء على compileSdk 31 و targetSdk 31 يضمن استمرار البناء دون كسر أدوات التحقق.',
    detailEn:
      'Upstream sets minSdk 31 (Android 12), blocking installation on DiLink 4.0 head units reporting API 29. Keeping compileSdk 31 and targetSdk 31 preserves build compatibility.',
  },
  {
    id: 'manifest-perms',
    file: 'app/src/main/AndroidManifest.xml',
    lines: '4–8',
    apiSymbol: 'POST_NOTIFICATIONS, FOREGROUND_SERVICE, SYSTEM_ALERT_WINDOW',
    requiredApi: 'API 26–33 (graceful)',
    status: 'compatible',
    snippet: '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
    titleAr: 'أذونات النظام وخدمات الخلفية في Manifest',
    titleEn: 'Manifest permissions and receivers',
    detailAr:
      'أذونات الإقلاع والنافذة العائمة وخدمات المقدمة متوافقة مع Android 10. إذن POST_NOTIFICATIONS مخصص لـ Android 13+ ويتم تجاهله بأمان على API 29.',
    detailEn:
      'Boot, overlay, and foreground service permissions are valid on Android 10. POST_NOTIFICATIONS targets API 33+ and is safely ignored by Android 10 package installer.',
  },
  {
    id: 'fg-service',
    file: 'AebService.java & BootReceiver.java',
    lines: '38, 117',
    apiSymbol: 'startForegroundService() / NotificationChannel',
    requiredApi: 'API 26',
    status: 'compatible',
    snippet: 'context.startForegroundService(serviceIntent); // minSdk 31 comment in upstream',
    titleAr: 'تشغيل خدمة المقدمة وقناة الإشعارات',
    titleEn: 'Foreground service & NotificationChannel calls',
    detailAr:
      'رغم وجود تعليق minSdk 31 في الكود الأصلي، فإن startForegroundService و NotificationChannel متاحان منذ Android 8.0 (API 26) ويعملان على API 29.',
    detailEn:
      'Despite upstream comments saying minSdk 31, startForegroundService() and NotificationChannel were introduced in Android 8.0 (API 26) and operate natively on API 29.',
  },
  {
    id: 'accessibility-boot',
    file: 'AebAccessibilityService.java & MainActivity.java',
    lines: '24, 350',
    apiSymbol: 'AccessibilityService / Settings.canDrawOverlays()',
    requiredApi: 'API 23–26',
    status: 'compatible',
    snippet: 'if (cbFloating.isChecked() && !Settings.canDrawOverlays(this)) { ... }',
    titleAr: 'خدمة إمكانية الوصول والنافذة العائمة HUD',
    titleEn: 'Accessibility service & floating HUD overlay',
    detailAr:
      'تعتمد HudController.java على TYPE_APPLICATION_OVERLAY (API 26+) وفحص Settings.canDrawOverlays (API 23+)، وكلاهما مدعوم في Android 10 مع ملاحظة أن سياسات DiLink 4.0 قد تقيّد التشغيل التلقائي عند الإقلاع.',
    detailEn:
      'HudController uses TYPE_APPLICATION_OVERLAY (API 26+) and Settings.canDrawOverlays (API 23+), both supported on Android 10, though DiLink 4.0 OEM policies may gate boot auto-start.',
  },
  {
    id: 'adb-autoservice',
    file: 'AdbHelper.java',
    lines: '120, 160–161',
    apiSymbol: 'service call autoservice 5 / 6 (1038, 852492332, 944767020)',
    requiredApi: 'DiLink Binder',
    status: 'unverified',
    snippet: 'String cmd1 = "service call autoservice 6 i32 1038 i32 852492332 i32 " + val;',
    titleAr: 'معاملات قراءة وكتابة AEB عبر autoservice',
    titleEn: 'AEB binder transactions via autoservice',
    detailAr:
      'لم يتم التحقق من أرقام معاملات Binder (5 و 6) والمعرّفات 1038 / 852492332 / 944767020 على DiLink 4.0 حتى الآن. يحظر تعديلها في هذه المرحلة قبل فحص الاستجابة الحقيقية على الوحدة الثابتة.',
    detailEn:
      'Binder transaction codes (5, 6) and IDs (1038, 852492332, 944767020) are validated on DiLink 5.0 only and remain unverified on DiLink 4.0.',
  },
  {
    id: 'locked-core',
    file: 'core/Engine.java & core/ParcelParser.java',
    lines: 'All',
    apiSymbol: '9-state Engine, ParcelParser, AdbCrypto, applicationId',
    requiredApi: 'Java 8 (:core)',
    status: 'locked',
    snippet: 'implementation project(\':core\') // Pure Java logic + preBuild :core:selfTest',
    titleAr: 'الثوابت المقفلة (Engine, ParcelParser, applicationId)',
    titleEn: 'Locked upstream invariants (Engine, ParcelParser, IDs)',
    detailAr:
      'تُلزم التعليمات بعدم تغيير applicationId أو namespace أو بروتوكول ADB المحلي أو محلل Parcel أو آلة الحالات (Engine) في حزمة البداية.',
    detailEn:
      'Starter patch instructions explicitly forbid altering applicationId, namespace, ADB protocol, ParcelParser, or the Engine state machine at this stage.',
  },
];

export interface VerificationItem {
  id: string;
  phase: 'pc' | 'headunit';
  titleAr: string;
  titleEn: string;
  command?: string;
  warningAr?: string;
  warningEn?: string;
}

export const VERIFICATION_CHECKLIST: VerificationItem[] = [
  {
    id: 'verify-sdk',
    phase: 'pc',
    titleAr: 'تثبيت JDK 17 وحزمة Android SDK Platform 31 وتشغيل :core:selfTest',
    titleEn: 'Verify JDK 17, Android SDK Platform 31, and passing :core:selfTest',
    command: 'java -version && ./gradlew :core:selfTest',
  },
  {
    id: 'verify-apk-build',
    phase: 'pc',
    titleAr: 'توليد ملف app-debug.apk بنجاح عبر مهمة assembleDebug',
    titleEn: 'Build debug APK cleanly via :app:assembleDebug',
    command: './gradlew :app:assembleDebug',
  },
  {
    id: 'verify-api29',
    phase: 'headunit',
    titleAr: 'التحقق من رقم إصدار SDK على شاشة السيارة (يجب أن يُرجع 29)',
    titleEn: 'Confirm head-unit Android API level via ADB (expected: 29)',
    command: 'adb shell getprop ro.build.version.sdk',
  },
  {
    id: 'verify-install',
    phase: 'headunit',
    titleAr: 'التحقق من قبول التثبيت على DiLink 4.0 دون خطأ INSTALL_FAILED_OLDER_SDK',
    titleEn: 'Verify APK installation succeeds on DiLink 4.0 (no OLDER_SDK error)',
    command: 'adb install -r app/build/outputs/apk/debug/app-debug.apk',
  },
  {
    id: 'verify-read-only',
    phase: 'headunit',
    titleAr: 'فحص قراءة حالة AEB ومراقبة سجل Logcat والمركبة متوقفة تماماً (P)',
    titleEn: 'Inspect ADB loopback pairing & read-only AEB reply while parked (P)',
    command: 'adb logcat -s AEB_Toggle AebService BYDAebToggle',
    warningAr: 'اختبار متوقف فقط — يمنع تجربة أو تعديل معاملات AEB على الطرق العامة.',
    warningEn: 'Stationary bench test only — never test AEB writes on public roads.',
  },
  {
    id: 'verify-boot',
    phase: 'headunit',
    titleAr: 'فحص سلوك الإقلاع التلقائي بعد إعادة تشغيل الشاشة (غير مضمون في البداية)',
    titleEn: 'Evaluate auto-start after ignition/reboot (uncertified in starter patch)',
  },
];
