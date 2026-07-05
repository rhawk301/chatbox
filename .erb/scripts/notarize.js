module.exports = async function notarizeMacos(context) {
    const { electronPlatformName, appOutDir } = context
    if (electronPlatformName !== 'darwin') {
        return
    }

    const appName = context.packager.appInfo.productFilename
    const appPath = `${appOutDir}/${appName}.app`

    if (!('APPLE_ID' in process.env && 'APPLE_ID_PASS' in process.env && 'APPLE_TEAM_ID' in process.env)) {
        // No Apple credentials — ad-hoc re-sign the entire bundle so every binary
        // (including the bundled Electron Framework) has a consistent Team ID of "".
        // Without this, the Electron Framework keeps its original Electron Team ID
        // while the main binary has none, causing macOS to abort at dyld with
        // "mapping process and mapped file have different Team IDs".
        const { execSync } = await import('child_process')
        console.log(`[afterSign] No Apple credentials — ad-hoc re-signing: ${appPath}`)
        execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' })
        return
    }

    const { notarize } = await import('@electron/notarize')
    console.log('[Notarize] start macOS notarization: notarize.js running with notarytool')

    await notarize({
        tool: 'notarytool',
        appBundleId: 'xyz.chatboxapp.app',
        appPath,
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_ID_PASS,
        teamId: process.env.APPLE_TEAM_ID,
    })
}
