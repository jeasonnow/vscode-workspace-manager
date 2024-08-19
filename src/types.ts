export enum VSCodeBuild {
  Code = "Code",
  Insiders = "Code - Insiders",
  VSCodium = "VSCodium",
  VSCodiumMinor = "VSCodium < 1.71",
  WebStorm = "WebStorm",
  Cursor = "Cursor",
}

export type Preferences = {
  build: VSCodeBuild;
  workspacePath: string;
};

export type Arguments = {
  project: string;
};
