import { exec, execSync } from 'child_process'
import { argv } from 'process'
import readline from 'readline'
import fs from 'fs-extra'
import path from 'path'

const env = {
  'tf-beta': {
    config: 'Beta',
    pubxml: 'Beta.0.File.hbo.pubxml',
    branch: 'beta_TF',
  },
  'tf-online': {
    config: 'Release.Tengfei',
    pubxml: 'Prod.File.TF.pubxml',
    branch: 'online_TF',
  },
  'zb-beta': {
    config: 'Beta.1',
    pubxml: 'Beta.1.File.hbo.pubxml',
    branch: 'beta_ZB',
  },
  'zb-online': {
    config: 'Release.Juli',
    pubxml: 'Prod.File.ZB.pubxml',
    branch: 'online_ZB',
  },
}

const cwd = path.resolve('C:\\Users\\howard.ye\\3D Objects\\hongbo.agentweb')
const vsBat = path.resolve(
  'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\Common7\\Tools\\VsDevCmd.bat'
)
const output = path.resolve('.', 'deploy')
// const cleanFolder = path.resolve('C:\\Deploy')

function cleanData() {
  // fs.rmSync(cleanFolder, { recursive: true, force: true })
  fs.rmSync(output, { recursive: true, force: true })
}

function build(target) {
  const e = env[target]
  setBranch(e)
  cleanData()
  const cmd = `msbuild /p:PublishProfile="${e.pubxml}" /p:DeployOnBuild=true /p:Configuration="${e.config}"`
  return new Promise((rs, rj) => {
    exec(
      `chcp 65001 && "${vsBat}"&&${cmd}`,
      { cwd },
      (error, stdout, stderr) => {
        console.log(`${stdout}`)
        copyFolder(target)
        if (error) {
          rj()
          console.log(`exec error: ${error}`)
        } else {
          rs()
        }
      }
    )
  })
}

function copyFolder(target) {
  const pubxmlPath = path.resolve(
    cwd,
    'HongBo.AgentWeb',
    'Properties',
    'PublishProfiles',
    env[target].pubxml
  )
  const data = fs.readFileSync(pubxmlPath).toString()
  const publishFolder = path.resolve(
    data.match(/(?<=\<PublishUrl\>).*(?=\<\/PublishUrl\>)/)[0]
  )
  const hash = execSync('git rev-parse HEAD', { cwd }).toString()
  fs.copySync(publishFolder, path.resolve(output, `HongBo.AgentWeb`))
  fs.writeFileSync(
    path.resolve(output, target + '.txt'),
    `${target}\nHongBo.AgentWeb:${hash}`
  )
}
function setBranch(e) {
  execSync(`git switch ${e.branch} -f`, { cwd })
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('1.TF Beta\n2.ZB Beta\n3.TF Online\n4.ZB Online\n', answer => {
  const envIndex = {
    1: 'tf-beta',
    2: 'zb-beta',
    3: 'tf-online',
    4: 'zb-online',
  }
  build(envIndex[answer])
  rl.close()
})
