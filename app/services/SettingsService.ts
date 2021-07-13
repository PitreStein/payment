import { lastValueFrom, Observable, ReplaySubject } from "rxjs";
import { first } from "rxjs/operators";
import { Environment } from "../env/Environment";
import i18n from "../i18n/i18n";
import { getValue, storeValue } from "./StorageService";

const SettingsKey = "settings";
const DefaultSettings: Partial<AppSettings> = {
  language: Environment.defaultLanguage,
};

export interface AppSettings {
  language: string;
}

class SettingsServiceClass {
  private settings$ = new ReplaySubject<AppSettings>();

  constructor() {
    this.Settings.then((settings) => {
      this.settings$.next(settings);
      i18n.changeLanguage(settings.language);
    });
  }

  public get Settings$(): Observable<AppSettings> {
    return this.settings$;
  }

  public get Settings(): Promise<AppSettings> {
    return getValue<AppSettings>(SettingsKey)
      .then((settings) => ({ ...DefaultSettings, ...settings }));
  }

  public updateSettings(update: Partial<AppSettings>): Promise<void> {
    // wait for init
    return lastValueFrom(this.settings$.pipe(first())).then(() => {
      if (update.language) {
        i18n.changeLanguage(update.language);
      }

      return this.Settings.then((settings) => ({ ...settings, ...update }))
        .then((settings) => storeValue(SettingsKey, settings))
        .then((settings) => this.settings$.next(settings));
    });
  }
}

const SettingsService = new SettingsServiceClass();
export default SettingsService;
