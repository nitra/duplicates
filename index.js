#!/usr/bin/env node

const { exec } = require('child_process')
const { cosmiconfigSync } = require('cosmiconfig')

const explorerSync = cosmiconfigSync('duplicates', {
  noExt: "defaultLoaders['.json']"
})

const appCfg = explorerSync.search().config.ignore || []

exec(
  `git ls-files -z | xargs -0 md5  | awk -F '=' '{print $2 "\t" $1}' | sort `,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`)
      return
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`)
      return
    }

    // Remove from config
    const uniqAfterFilter = stdout
      .split('\n')
      .filter(function (line) {
        return !appCfg.some(v => line.includes(v))
      })
      .join('\n')

    // Group in map
    const files = uniqAfterFilter.split('\n')
    const myMap = new Map()
    for (const file of files) {
      const [k, v] = file.split('MD5')

      if (!v) {
        continue
      }

      const filePath = v.trim().substr(1).slice(0, -1)
      if (myMap.has(k)) {
        myMap.set(k, [...myMap.get(k), filePath])
      } else {
        myMap.set(k, [filePath])
      }
    }

    // Remove uniq
    for (const [k, v] of myMap) {
      if (v.length === 1) {
        myMap.delete(k)
      }
    }

    for (const v of myMap.values()) {
      console.log('duplicate files: ', v)
    }

    console.log('count: ', myMap.size)
  }
)
