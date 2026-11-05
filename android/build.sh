#!/usr/bin/env bash
# Builds the Android app (Karburanti-<version>.apk) without Gradle: aapt2 → javac → d8 → apksigner.
# Needs JDK 17+ and the Android SDK (build-tools 35.0.0, platforms;android-35) in $ANDROID_HOME.
# Usage: ANDROID_HOME=/path/to/sdk ./build.sh 1.0.0 1
set -euo pipefail
VERSION=${1:-1.0.0}
CODE=${2:-1}
SDK=${ANDROID_HOME:-/root/android-sdk}
BT=$SDK/build-tools/35.0.0
JAR=$SDK/platforms/android-35/android.jar
cd "$(dirname "$0")"
OUT=build
rm -rf $OUT && mkdir -p $OUT/assets $OUT/gen $OUT/classes $OUT/dex

node ../scripts/build-karburant.js --desktop $OUT/assets/index.html

$BT/aapt2 compile --dir res -o $OUT/res.zip
# targetSdk 34 keeps the classic window (status bar above the page, not drawn under it).
$BT/aapt2 link -I "$JAR" --manifest AndroidManifest.xml -A $OUT/assets $OUT/res.zip \
  --java $OUT/gen --min-sdk-version 29 --target-sdk-version 34 \
  --version-code "$CODE" --version-name "$VERSION" -o $OUT/unsigned.apk
javac --release 11 -classpath "$JAR" -d $OUT/classes $(find src $OUT/gen -name '*.java') 2>&1 | grep -v '^Picked up' || true
$BT/d8 --release --min-api 29 --lib "$JAR" --output $OUT/dex $(find $OUT/classes -name '*.class')
(cd $OUT/dex && zip -q ../unsigned.apk classes.dex)
$BT/zipalign -p -f 4 $OUT/unsigned.apk $OUT/aligned.apk
# The same key must sign every version, or Android refuses the update (and the app's data
# can only be kept through a backup). The key and its password stay out of git: keep
# karburanti.keystore and karburanti.keystore.pass safe and put them back here to build.
KS=${KS:-karburanti.keystore}
[ -f "$KS" ] && [ -f "$KS.pass" ] || { echo "Missing $KS or $KS.pass (the signing key)."; exit 1; }
$BT/apksigner sign --ks "$KS" --ks-pass file:"$KS.pass" \
  --out "$OUT/Karburanti-$VERSION.apk" $OUT/aligned.apk
$BT/apksigner verify "$OUT/Karburanti-$VERSION.apk"
echo "Wrote android/$OUT/Karburanti-$VERSION.apk"
