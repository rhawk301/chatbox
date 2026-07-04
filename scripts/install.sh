#!/usr/bin/env bash
# install.sh — Homebrew-cask-style app installer for Chatbox fork
#
# Usage:
#   ./scripts/install.sh                  install (prompts if already installed)
#   ./scripts/install.sh --force          quit existing + reinstall without prompting
#   ./scripts/install.sh --uninstall      remove the app from /Applications
#
# Run from repo root after: pnpm exec electron-builder build --dir --publish never

set -euo pipefail

# ── Per-project config ────────────────────────────────────────────────────────
DISPLAY_NAME="Chatbox"
BINARY_NAME="Chatbox"
APP_BUNDLE="Chatbox.app"
BUNDLE_ID="xyz.chatboxapp.app"
# electron-builder --dir produces mac-arm64, mac, or mac-universal depending on host
SOURCE_APP="$(ls -d release/build/mac*/Chatbox.app 2>/dev/null | head -1)"
DEST_DIR="/Applications"
DEST_APP="${DEST_DIR}/${APP_BUNDLE}"
# Read version from the built package; fall back to package.json in repo root
APP_VERSION="$(node -p "require('./release/app/package.json').version" 2>/dev/null \
              || node -p "require('./package.json').version" 2>/dev/null \
              || echo "dev")"
# ─────────────────────────────────────────────────────────────────────────────

FORCE=0
UNINSTALL=0

for arg in "$@"; do
  case "$arg" in
    --force)     FORCE=1 ;;
    --uninstall) UNINSTALL=1 ;;
    -h|--help)
      echo "Usage: $0 [--force] [--uninstall]"
      echo "  (no flags)   install — prompts when already installed"
      echo "  --force      quit running instance and reinstall without prompting"
      echo "  --uninstall  quit and remove ${DEST_APP}"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

# ── Colour helpers (Homebrew pattern) ─────────────────────────────────────────
if [[ -t 1 ]]; then
  tty_escape() { printf "\033[%sm" "$1"; }
else
  tty_escape() { :; }
fi
tty_mkbold()  { tty_escape "1;$1"; }
tty_green="$(tty_mkbold 32)"
tty_blue="$(tty_mkbold 34)"
tty_red="$(tty_mkbold 31)"
tty_bold="$(tty_mkbold 39)"
tty_reset="$(tty_escape 0)"

shell_join() {
  local arg
  printf "%s" "$1"
  shift
  for arg in "$@"; do printf " %s" "${arg// /\\ }"; done
}

ohai() {
  printf "${tty_blue}==>${tty_bold} %s${tty_reset}\n" "$(shell_join "$@")"
}

warn() {
  printf "${tty_red}Warning${tty_reset}: %s\n" "$1" >&2
}

abort() {
  printf "%s\n" "$@" >&2
  exit 1
}

execute() {
  if ! "$@"; then
    abort "$(printf "Failed during: %s" "$(shell_join "$@")")"
  fi
}

# Run with sudo only if the target isn't writable by the current user.
execute_sudo() {
  local -a args=("$@")
  if [[ "${EUID:-${UID}}" == "0" ]]; then
    ohai "${args[@]}"
    execute "${args[@]}"
  else
    ohai "sudo" "${args[@]}"
    execute /usr/bin/sudo "${args[@]}"
  fi
}

# ── Process helpers ───────────────────────────────────────────────────────────

is_running() {
  pgrep -x "${BINARY_NAME}" > /dev/null 2>&1
}

quit_app() {
  if ! is_running; then return; fi

  ohai "Quitting ${DISPLAY_NAME}"

  /usr/bin/osascript \
    -e "tell application id \"${BUNDLE_ID}\" to quit" 2>/dev/null || true

  local waited=0
  while is_running && [[ $waited -lt 4 ]]; do
    sleep 1
    waited=$((waited + 1))
  done

  if is_running; then
    warn "${DISPLAY_NAME} did not quit gracefully — sending SIGTERM"
    pkill -x "${BINARY_NAME}" 2>/dev/null || true
    sleep 1
  fi

  if is_running; then
    warn "Still running — sending SIGKILL"
    pkill -9 -x "${BINARY_NAME}" 2>/dev/null || true
    sleep 1
  fi

  if is_running; then
    abort "Could not quit ${DISPLAY_NAME}. Close it manually and retry."
  fi
}

# ── Install helpers ───────────────────────────────────────────────────────────

remove_existing() {
  if [[ ! -d "${DEST_APP}" ]]; then return; fi
  ohai "Removing existing ${DEST_APP}"
  if [[ -w "${DEST_APP}" ]]; then
    execute rm -rf "${DEST_APP}"
  else
    execute_sudo rm -rf "${DEST_APP}"
  fi
}

install_app() {
  if [[ -d "${DEST_APP}" ]]; then
    # Upgrade: sync in-place so the .app directory keeps its inode.
    # macOS Dock bookmarks track inodes; rm+cp creates a new inode → "?" in Dock.
    # rsync --delete updates every file while keeping the parent dir's inode intact.
    ohai "Upgrading '${DEST_APP}' (in-place sync)"
    if [[ -w "${DEST_APP}" ]]; then
      execute rsync -a --delete "${SOURCE_APP}/" "${DEST_APP}/"
    else
      execute_sudo rsync -a --delete "${SOURCE_APP}/" "${DEST_APP}/"
    fi
  else
    # Fresh install — no existing bundle to preserve.
    ohai "Copying '${APP_BUNDLE}' to '${DEST_APP}'"
    if [[ -w "${DEST_DIR}" ]]; then
      execute cp -a "${SOURCE_APP}" "${DEST_APP}"
    else
      execute_sudo cp -a "${SOURCE_APP}" "${DEST_APP}"
    fi
  fi

  # Ad-hoc sign — required after copying since we didn't use Apple notarization
  ohai "Re-signing ${DEST_APP}"
  codesign --force --deep --sign - "${DEST_APP}" 2>/dev/null || \
    warn "codesign failed — app may prompt on first launch"
}

verify_install() {
  [[ -d "${DEST_APP}" ]] ||
    abort "Installation failed — ${DEST_APP} not found."
  [[ -x "${DEST_APP}/Contents/MacOS/${BINARY_NAME}" ]] ||
    abort "Installation failed — binary not executable inside ${DEST_APP}."
}

launch_app() {
  ohai "Launching ${DISPLAY_NAME}"
  open "${DEST_APP}"
}

# ── Uninstall ─────────────────────────────────────────────────────────────────

do_uninstall() {
  ohai "Uninstalling ${DISPLAY_NAME}"

  if [[ ! -d "${DEST_APP}" ]]; then
    warn "${DEST_APP} is not installed — nothing to remove."
    exit 0
  fi

  quit_app
  remove_existing

  printf "\n${tty_green}✔︎${tty_reset}  ${tty_bold}%s was successfully uninstalled.${tty_reset}\n\n" \
    "${DISPLAY_NAME}"
}

# ── Install ───────────────────────────────────────────────────────────────────

do_install() {
  [[ -n "${SOURCE_APP}" && -d "${SOURCE_APP}" ]] ||
    abort "Built app not found. Run 'make install' or 'pnpm exec electron-builder build --dir --publish never' first."

  ohai "Installing ${DISPLAY_NAME} (${APP_VERSION})"

  if [[ -d "${DEST_APP}" ]]; then
    if [[ "${FORCE}" -eq 0 ]]; then
      printf "${tty_bold}%s is already installed at %s.${tty_reset}\n" \
        "${DISPLAY_NAME}" "${DEST_APP}"
      printf "Reinstall? [y/N] "
      read -r reply
      if [[ "${reply}" != "y" && "${reply}" != "Y" ]]; then
        echo "Aborted."
        exit 0
      fi
    fi
  fi

  quit_app
  install_app
  verify_install
  launch_app

  printf "\n${tty_green}🍺${tty_reset}  ${tty_bold}%s (%s) was successfully installed!${tty_reset}\n\n" \
    "${DISPLAY_NAME}" "${APP_VERSION}"
}

# ── Entry point ───────────────────────────────────────────────────────────────

if [[ "${UNINSTALL}" -eq 1 ]]; then
  do_uninstall
else
  do_install
fi
