import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  set(key: string, value: string | object): void {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (error) {
      console.error(`LocalStorageService: no se pudo guardar "${key}"`, error);
    }
  }

  get<T>(key: string): T | null {
    const data = this.getString(key);
    if (data === null) {
      return null;
    }
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as T;
    }
  }

  getString(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`LocalStorageService: no se pudo leer "${key}"`, error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`LocalStorageService: no se pudo eliminar "${key}"`, error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('LocalStorageService: no se pudo limpiar el almacenamiento', error);
    }
  }

  has(key: string): boolean {
    return this.getString(key) !== null;
  }
}
