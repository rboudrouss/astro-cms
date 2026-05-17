import { access } from 'fs/promises'
import { join } from 'path'
import { spawn as nodeSpawn, type ChildProcess } from 'child_process'
import type { WebContents } from 'electron'
import { IpcChannels } from '../shared/ipc'
import type { PackageManager, DepsInstallResult } from '../shared/types'

type SpawnFn = (cmd: string, args: string[], opts: object) => ChildProcess

export async function needsInstall(projectPath: string): Promise<boolean> {
  try {
    await access(join(projectPath, 'node_modules'))
    return false
  } catch {
    return true
  }
}

export async function detectPackageManager(projectPath: string): Promise<PackageManager> {
  const lockfiles: [string, PackageManager][] = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['package-lock.json', 'npm'],
    ['yarn.lock', 'yarn']
  ]
  for (const [file, pm] of lockfiles) {
    try {
      await access(join(projectPath, file))
      return pm
    } catch {}
  }
  return 'npm'
}

export function installDependencies(
  projectPath: string,
  packageManager: PackageManager,
  sender: WebContents,
  spawnFn: SpawnFn = nodeSpawn
): Promise<DepsInstallResult> {
  return new Promise((resolve) => {
    const child = spawnFn(packageManager, ['install'], {
      cwd: projectPath,
      shell: true
    })

    const sendOutput = (line: string): void => {
      if (!sender.isDestroyed()) {
        sender.send(IpcChannels.DEPS_INSTALL_OUTPUT, { line })
      }
    }

    child.stdout?.on('data', (data: Buffer) => {
      sendOutput(data.toString())
    })

    child.stderr?.on('data', (data: Buffer) => {
      sendOutput(data.toString())
    })

    child.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
        packageManager
      })
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, packageManager })
      } else {
        resolve({
          success: false,
          error: `${packageManager} install exited with code ${code}`,
          packageManager
        })
      }
    })
  })
}
