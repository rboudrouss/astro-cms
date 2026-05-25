export type GitOps = {
  init(): Promise<void>
  branchLocal(): Promise<string[]>
  currentBranch(): Promise<string>
  checkout(branch: string): Promise<void>
  checkoutNewBranch(branch: string): Promise<void>
  add(files: string | string[]): Promise<void>
  commit(message: string): Promise<string>
  status(): Promise<{ isClean: boolean; files: string[] }>
  push(remote: string, branch: string): Promise<void>
  fetch(remote: string): Promise<void>
  revParse(ref: string): Promise<string>
  log(maxCount: number, ref?: string): Promise<Array<{ hash: string; date: string; message: string }>>
}
