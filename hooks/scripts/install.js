#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var resolve = require('path').resolve
var findup = require('../../libs/fs/findup')
var warn = require('../../libs/sys/warn')
var shell = require('../../libs/tty/shell')

var config = require('./config')
var template = fs.readFileSync(resolve(__dirname, 'template.js'))
var reTemplate = /Generated by mora-scripts\. Do not edit this file\./

var args = process.argv.slice(2).join(',')
if (/reverse|uninstall/.test(args)) {
  console.log('========= UNINSTALL HOOKS =========')
  uninstall()
} else {
  console.log('========= INSTALL HOOKS =========')
  install()
}

function install() {
  var gitDir
  try {
    gitDir = findup.git()
    config.hooks.forEach(installHook.bind(null, resolve(gitDir, 'hooks')))
    installGitMessage(path.join(path.dirname(gitDir), '.gitmessage'))
  } catch (e) {
    warnAboutGit()
  }
}

function uninstall() {
  try {
    var gitDir = findup.git()
    config.hooks.forEach(uninstallHook.bind(null, resolve(gitDir, 'hooks')))
    uninstallGitMessage(path.join(path.dirname(gitDir), '.gitmessage'))
  } catch (e) {}
}

function installHook(dir, file) {
  var filepath = resolve(dir, file)
  if (!isHookTemplateFile(filepath)) {
    console.log('  install hook ' + file)
    backup(filepath)
    fs.writeFileSync(filepath, template)
    fs.chmodSync(filepath, '755')
  } else {
    console.log('  update hook ' + file)
    fs.writeFileSync(filepath, template) // 更新原来的文件
  }
}

function uninstallHook(dir, file) {
  var filepath = resolve(dir, file)
  if (isHookTemplateFile(filepath)) {
    console.log('  uninstall hook ' + file)
    restore(filepath)
  }
}

function installGitMessage(messageFile) {
  console.log('\n  set git commit.template')
  if (!exists(messageFile)) {
    // 文件不存在，使用模板
    fs.writeFileSync(messageFile, fs.readFileSync(resolve(__dirname, '..', 'gitmessage')).toString())
  }
  shell('git config --local commit.template ' + messageFile)
}

function uninstallGitMessage(messageFile) {
  shell('git config --local --unset commit.template')
  if (exists(messageFile)) {
    warn(
      '\ngit config commit.template has already unset.\n'
      + 'so file ' + messageFile + ' not in use.\n'
      + 'you can delete it anytime.\n'
    )
  }
}

function isHookTemplateFile(filepath) {
  try {
    return reTemplate.test(fs.readFileSync(filepath).toString())
  } catch (e) { return false }
}

function warnAboutGit() {
  warn(
    '\nThis does not seem to be a git project.\n'
    + '===========================================================\n\n'
    + 'Although mora-scripts was installed, the actual hooks have not.\n'
    + 'Please run the following command manually:\n\n'
    + '\tgit init\n'
    + '\tnpm explore mora-scripts -- npm run postinstall\n\n'
    + 'Please ignore this message if you are not using mora-scripts/hooks directly.\n'
  )
}

function exists(filepath) {
  try {
    return fs.statSync(filepath).isFile()
  } catch (e) {
    return false
  }
}

function backup(filepath) {
  rename(filepath, filepath + '.bkp')
}

function restore(filepath) {
  rename(filepath + '.bkp', filepath)
}

function rename(from, to) {
  if (exists(to)) fs.unlinkSync(to)
  if (exists(from)) fs.renameSync(from, to)
}
