import { lastValueFrom, Observable, ReplaySubject } from "rxjs";
import { first } from "rxjs/operators";
import { Environment } from "../env/Environment";
import i18n from "../i18n/i18n";
import { Language } from "../models/Language";
import { getLanguages } from "./ApiService";
import NotificationService from "./NotificationService";
import StorageService from "./StorageService";

const SettingsKey = "settings";
const DefaultSettings: Partial<AppSettings> = {
  language: Environment.defaultLanguage,
};

export interface AppSettings {
  language: string;
}

class SettingsServiceClass {
  private settings$ = new ReplaySubject<AppSettings>();

  public Languages: Language[] = [];

  constructor() {
    this.Settings.then((settings) => {
      this.settings$.next(settings);
      i18n.changeLanguage(settings.language);
    });

    getLanguages()
      .then((languages) => (this.Languages = languages.filter((l) => l.enable)))
      .then(() => this.Settings)
      .then((settings) => this.Languages.find((l) => l.symbol == settings.language)?.symbol ?? Environment.defaultLanguage)
      .then((currentLanguage) => this.updateSettings({ language: currentLanguage }))
      .catch(() => NotificationService.error(i18n.t("feedback.load_failed")));
  }

  public get Settings$(): Observable<AppSettings> {
    return this.settings$;
  }

  public get Settings(): Promise<AppSettings> {
    return StorageService.getValue<AppSettings>(SettingsKey)
      .then((settings) => ({ ...DefaultSettings, ...settings }));
  }

  public get Language(): Promise<Language | undefined> {
    return this.Settings.then((settings) => this.Languages.find((l) => l.symbol === settings.language));
  }

  public updateSettings(update: Partial<AppSettings>): Promise<void> {
    // wait for init
    return lastValueFrom(this.settings$.pipe(first())).then(() => {
      if (update.language) {
        i18n.changeLanguage(update.language);
      }

      return this.Settings.then((settings) => ({ ...settings, ...update }))
        .then((settings) => StorageService.storeValue(SettingsKey, settings))
        .then((settings) => this.settings$.next(settings));
    });
  }
}

const SettingsService = new SettingsServiceClass();
export default SettingsService;
