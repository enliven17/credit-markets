/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.ts' {
  const content: any;
  export default content;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_FLOW_NETWORK?: string;
    NEXT_PUBLIC_FLOWWAGER_CONTRACT?: string;
  }
}