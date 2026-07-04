export PATH := /opt/homebrew/opt/node@22/bin:$(PATH)

SHELL        := /bin/bash
.SHELLFLAGS  := -o pipefail -c

PYTHON  := /Users/sean/.pyenv/versions/3.9.18/bin/python3
APP     := /Applications/Chatbox.app
PNPM    := pnpm
LOG     := build.log

# Write a timestamped section header to the terminal and to $(LOG)
LOG_START = @printf "\n=== make $@ [%s] ===\n" "$$(date '+%Y-%m-%d %H:%M:%S')" | tee -a $(LOG)

.PHONY: help status install-deps dev build test clean \
        install install-dry-run uninstall package package-all \
        deploy-asar patch-asar patch-status patch-restore \
        log-show log-clear

help:  ## Show this help
	@awk 'BEGIN{FS=":.*##"} /^[a-zA-Z_-]+:.*##/{printf "  %-20s %s\n",$$1,$$2}' $(MAKEFILE_LIST)

status:  ## Show fork state, dependency versions, and installed app status
	@BOLD="\033[1m"; RESET="\033[0m"; BLUE="\033[34m"; \
	  GREEN="\033[32m"; YELLOW="\033[33m"; \
	  BRANCH=$$(git branch --show-current); \
	  AHEAD=$$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?"); \
	  DIRTY=$$(git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null && echo "clean" || echo "uncommitted changes"); \
	  WANT=$$(node -p "Object.assign({},require('./package.json').dependencies||{},require('./package.json').devDependencies||{})['@ai-sdk/perplexity']" 2>/dev/null || echo "?"); \
	  LOCKED=$$(grep -m1 "@ai-sdk/perplexity@[0-9]" pnpm-lock.yaml 2>/dev/null \
	    | sed "s/.*@ai-sdk\/perplexity@//" | tr -d "': \n"); \
	  INST_VER=$$(defaults read $(APP)/Contents/Info.plist CFBundleShortVersionString 2>/dev/null || echo "not installed"); \
	  RUNNING=$$(pgrep -x Chatbox > /dev/null 2>&1 && echo "running" || echo "not running"); \
	  DIST=$$(test -d release/app/dist && echo "✓ exists" || echo "✗ missing (run: make build)"); \
	  BUILD=$$(test -d release/build && echo "✓ exists" || echo "✗ missing (run: make install)"); \
	  LOG_INFO=$$(test -f $(LOG) && printf "$(LOG)  (%d lines, last: %s)" "$$(wc -l < $(LOG))" "$$(tail -1 $(LOG) | cut -c1-60)" || echo "$(LOG)  (no log yet)"); \
	  printf "\n$${BLUE}==>$${BOLD} Chatbox Fork Status$${RESET}\n\n"; \
	  printf "$${BOLD}  Git$${RESET}\n"; \
	  printf "    Branch:        %s\n" "$$BRANCH"; \
	  printf "    Upstream:      origin/main (chatboxai/chatbox)\n"; \
	  printf "    Fork remote:   fork/main   (rhawk301/chatbox)\n"; \
	  printf "    Commits ahead: %s\n" "$$AHEAD"; \
	  printf "    Working tree:  %s\n" "$$DIRTY"; \
	  printf "\n$${BOLD}  Changed files vs upstream$${RESET}\n"; \
	  git diff --name-only origin/main..HEAD 2>/dev/null | sed "s/^/    /"; \
	  printf "\n$${BOLD}  Key dependency$${RESET}\n"; \
	  if [ "$$LOCKED" = "3.0.17" ]; then \
	    printf "    @ai-sdk/perplexity  want: %-14s locked: %s  $${YELLOW}⚠ run make install-deps$${RESET}\n" "$$WANT" "$$LOCKED"; \
	  else \
	    printf "    @ai-sdk/perplexity  want: %-14s locked: %s  $${GREEN}✓$${RESET}\n" "$$WANT" "$$LOCKED"; \
	  fi; \
	  printf "\n$${BOLD}  Installed app$${RESET}\n"; \
	  printf "    /Applications/Chatbox.app   version: %s  (%s)\n" "$$INST_VER" "$$RUNNING"; \
	  $(PYTHON) scripts/fix-perplexity-streaming.py --status 2>/dev/null | sed "s/^/    /"; \
	  printf "\n$${BOLD}  Build artifacts$${RESET}\n"; \
	  printf "    release/app/dist/   %s\n" "$$DIST"; \
	  printf "    release/build/      %s\n" "$$BUILD"; \
	  printf "\n$${BOLD}  Build log$${RESET}\n"; \
	  printf "    %s\n" "$$LOG_INFO"; \
	  printf "\n"

install-dry-run:  ## Simulate 'make install' without making any changes
	@BOLD="\033[1m"; RESET="\033[0m"; BLUE="\033[34m"; DIM="\033[2m"; \
	  APP_VER=$$(node -p "require('./release/app/package.json').version" 2>/dev/null \
	    || node -p "require('./package.json').version"); \
	  INST_VER=$$(defaults read $(APP)/Contents/Info.plist CFBundleShortVersionString 2>/dev/null \
	    || echo "not installed"); \
	  RUNNING=$$(pgrep -x Chatbox > /dev/null 2>&1 && echo "yes" || echo "no"); \
	  printf "\n$${BLUE}==>$${BOLD} make install — dry run (no changes made)$${RESET}\n\n"; \
	  printf "  $${BOLD}Steps that would run:$${RESET}\n\n"; \
	  printf "  1. pnpm run build          compile JS → release/app/dist/\n"; \
	  printf "  2. electron-builder --dir  build app bundle → release/build/mac*/Chatbox.app\n"; \
	  printf "  3. quit Chatbox            currently running: %s\n" "$$RUNNING"; \
	  printf "  4. remove                  /Applications/Chatbox.app  (installed: %s)\n" "$$INST_VER"; \
	  printf "  5. copy                    release/build/mac*/Chatbox.app → /Applications/\n"; \
	  printf "  6. codesign                ad-hoc re-sign /Applications/Chatbox.app\n"; \
	  printf "  7. launch                  open /Applications/Chatbox.app\n"; \
	  printf "\n  $${BOLD}Net result:$${RESET} Chatbox %s → %s\n" "$$INST_VER" "$$APP_VER"; \
	  printf "\n  $${DIM}Run 'make install' to proceed.$${RESET}\n\n"

# ── Dependencies ──────────────────────────────────────────────────────────────

install-deps:  ## pnpm install — syncs lockfile after version bumps
	$(LOG_START)
	$(PNPM) install 2>&1 | tee -a $(LOG)

# ── Development ───────────────────────────────────────────────────────────────

dev:  ## Start Electron dev server (hot reload)
	$(PNPM) run dev

build:  ## Compile JS only → release/app/dist/  (~30s)
	$(LOG_START)
	$(PNPM) run build 2>&1 | tee -a $(LOG)

test:  ## Run test suite
	$(LOG_START)
	$(PNPM) test 2>&1 | tee -a $(LOG)

clean:  ## Remove release/app/dist/ and release/build/
	$(LOG_START)
	$(PNPM) exec ts-node .erb/scripts/clean.js 2>&1 | tee -a $(LOG)

# ── Install / package ─────────────────────────────────────────────────────────

install: build  ## Build from source + install to /Applications  (~2 min)
	$(LOG_START)
	$(PNPM) exec electron-builder build --dir --publish never 2>&1 | tee -a $(LOG)
	@bash scripts/install.sh --force 2>&1 | tee -a $(LOG)

uninstall:  ## Quit Chatbox and remove it from /Applications
	$(LOG_START)
	@bash scripts/install.sh --uninstall 2>&1 | tee -a $(LOG)

package:  ## Full electron-builder build → release/build/*.dmg  (~5 min)
	$(LOG_START)
	$(PNPM) run package 2>&1 | tee -a $(LOG)

package-all:  ## Build for all platforms → release/build/
	$(LOG_START)
	$(PNPM) run package:all 2>&1 | tee -a $(LOG)

# ── asar operations ───────────────────────────────────────────────────────────

deploy-asar: build  ## Rebuild JS, hot-swap asar into installed app (skips full reinstall)
	$(LOG_START)
	$(PNPM) exec electron-builder build --dir --publish never 2>&1 | tee -a $(LOG)
	@BUILT=$$(ls -d release/build/mac*/Chatbox.app 2>/dev/null | head -1) && \
	  cp "$(APP)/Contents/Resources/app.asar" \
	     "$(APP)/Contents/Resources/app.asar.bak.$$(date +%Y%m%d-%H%M%S)" && \
	  cp "$$BUILT/Contents/Resources/app.asar" \
	     "$(APP)/Contents/Resources/app.asar" && \
	  codesign --force --deep --sign - "$(APP)" 2>&1 | tee -a $(LOG) && \
	  echo "Deployed. Restart Chatbox." | tee -a $(LOG)

patch-asar:  ## Binary-patch installed asar for Perplexity streaming fix (no rebuild)
	$(LOG_START)
	$(PYTHON) scripts/fix-perplexity-streaming.py 2>&1 | tee -a $(LOG)

patch-status:  ## Show Perplexity patch status of installed app.asar
	$(PYTHON) scripts/fix-perplexity-streaming.py --status

patch-restore:  ## Restore installed app.asar from latest backup
	$(LOG_START)
	$(PYTHON) scripts/fix-perplexity-streaming.py --restore 2>&1 | tee -a $(LOG)

# ── Log management ────────────────────────────────────────────────────────────

log-show:  ## Print build.log to terminal (tail -100 for recent output)
	@test -f $(LOG) && tail -100 $(LOG) || echo "No $(LOG) yet — run a build target first."

log-clear:  ## Archive build.log with timestamp and start fresh
	@if test -f $(LOG); then \
	  ARCH="build-$$(date '+%Y%m%d-%H%M%S').log"; \
	  mv $(LOG) "$$ARCH"; \
	  printf "Archived to $$ARCH\n"; \
	fi
	@printf "=== build.log created [%s] ===\n" "$$(date '+%Y-%m-%d %H:%M:%S')" > $(LOG)
	@printf "New $(LOG) ready.\n"
