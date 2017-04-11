#!/usr/bin/env bash
# MIT © Sindre Sorhus - sindresorhus.com
#
# Source from: https://gist.github.com/sindresorhus/7996717
#


# git hook to run a command after `git pull` if a specified file was changed
# Run `chmod +x post-merge` to make it executable then put it into `.git/hooks/`.

changed_files="$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)"

check_run() {
  echo "$changed_files" | grep --quiet "$1" && eval "$2"
}

# Example usage
# In this example it's used to run `npm install` if package.json changed and `bower install` if `bower.json` changed.
check_run package.json "yarn install || npm install"
check_run bower.json "bower install"
check_run composer.json "composer install"
