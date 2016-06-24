#!/usr/bin/env node

var path = require('path');
var spawn = require('cross-spawn');
var assign = require('../libs/assign');
var findup = require('../libs/findup');
var dotProp = require('../libs/dotProp');
var addEnvPath = require('../libs/addEnvPath');
var escapeRegExp = require('../libs/escapeRegExp');
var warn = require('../libs/warn');
var info = require('../libs/info');

var pkgFile = findup.pkg();
var rootDir = path.dirname(pkgFile);

var pkg = require(pkgFile);
var reEnvArg = /^(\w+)=(?:'(.+)'|"(.+)"|(.+))$/;
var rePkgArgs, pkgPrefixLength, addedEnvs = [];

var env = assign({}, process.env), cmd, args = [];

addEnvPath(env, path.join(rootDir, 'node_modules', '.bin'))
addEnvPath(env, path.join(rootDir, 'bin'))
buildPkgRe('pkg')

var ignoreNext;
process.argv.slice(2).map(function (arg, i, all) {
  if (ignoreNext) {
    ignoreNext = false;
    return ;
  }

  if (reEnvArg.test(arg)) {
    var envKey = RegExp.$1;
    var envVal = RegExp.$2 || RegExp.$3 || RegExp.$4;
    env[envKey] = envVal;
    addedEnvs.push(info.format(envKey + '=' + quoteShellArg(envVal)));
  } else if (arg[0] !== '-' && !cmd) {
    cmd = arg
  } else {
    // 这个参数只是给 cli/run.js 用的，所以要放在 cmd 前端
    if (['--prefix', '-p'].indexOf(arg) >= 0 && !cmd && all[i + 1]) {
      ignoreNext = true
      buildPkgRe(all[i + 1])
    } else {
      args.push(arg[0] === '-' ? arg : recursiveRepalcePkgArgs(arg))
    }
  }
})

// 输出当前运行的命令
console.log(
  'Running %s %s',
  info.format('%s %s', cmd, args.map(quoteShellArg).join(' ')),
  addedEnvs.length ? 'with env: ' + addedEnvs.join(', ') : ''
);
if (cmd) spawn(cmd, args, {stdio: 'inherit', env: env})
else warn('No command to run with !')

function recursiveRepalcePkgArgs(str) {
  if (!str) return '';
  return str.replace(rePkgArgs, function (raw, prefix, path) {
    return prefix + recursiveRepalcePkgArgs(dotProp(pkg, path.substr(pkgPrefixLength)));
  });
}

function buildPkgRe(prefix) {
  if (!prefix) return ;
  pkgPrefixLength = prefix.length + 1; // 1 is for the next character "."
  prefix = escapeRegExp(prefix)

  // rePkgArg = /^pkg(?:\.[\w-]+)+$/;
  // rePkgArg = new RegExp('^' + prefix + '(?:\\.[\\w-]+)+$')

  // rePkgArgs = /(^|\b|\s)pkg(?:\.[\w-]+)+\b/g;
  // 为什么前面判断那么复杂，而结尾只用了 \b
  //    前提要知道 \b 匹配的是一个字母和非字母的分界线
  //    prefix 可以是用户提供，如果用户提供的字符并不是一个字母，如 "%"，
  //    则会无法找到 \b 这样的分界线
  rePkgArgs = new RegExp('(^|\\b|\\s)(' + prefix + '(?:\\.[\\w-]+)+\\b)' ,'g')
}

function quoteShellArg(arg) {
  if (/[\s\*\(\)\`\$]/.test(arg)) {
    return '\'' + arg.replace(/'/g, '\\\'') + '\''
  } else {
    return arg;
  }
}