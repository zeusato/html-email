export interface EmailTemplateState {
  htmlContent: string;
  headerImage: string | null;
  footerImage: string | null;
  fileName: string | null;
  outlookCompatible: boolean;
  maxWidth: number;
  fontFamily: string;
}

export enum TabView {
  EDITOR = 'EDITOR',
  CODE = 'CODE',
  PREVIEW = 'PREVIEW',
}

export interface UploadState {
  isUploading: boolean;
  error: string | null;
}
