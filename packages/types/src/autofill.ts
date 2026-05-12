export interface AutofillRequest {
  url: string;
  tabId: number;
  frameId?: number;
}

export interface AutofillCredential {
  id: string;
  username: string;
  password: string;
  name: string;
  urls: string[];
}

export interface FormField {
  type: 'username' | 'password' | 'email' | 'text' | 'otp';
  selector: string;
  name?: string;
  id?: string;
  placeholder?: string;
  label?: string;
}

export interface DetectedForm {
  url: string;
  fields: FormField[];
  submitSelector?: string;
  isLoginForm: boolean;
  isSignupForm: boolean;
}

export interface NativeMessage {
  id: string;
  action: NativeAction;
  payload?: unknown;
}

export type NativeAction =
  | 'get-credentials'
  | 'fill-credentials'
  | 'save-credentials'
  | 'vault-unlocked'
  | 'vault-locked'
  | 'ping'
  | 'pong';

export interface NativeMessageResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
