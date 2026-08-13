import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

export interface PaginadorState {
  pageIndex: number;
  pageSize: number;
}

export class PaginadorDataSource<T> extends DataSource<T> {
  private readonly _data = new BehaviorSubject<readonly T[]>([]);
  private readonly _page = new BehaviorSubject<PaginadorState>({
    pageIndex: 0,
    pageSize: 10,
  });

  get length(): number {
    return this._data.value.length;
  }

  get pageIndex(): number {
    return this._page.value.pageIndex;
  }

  get pageSize(): number {
    return this._page.value.pageSize;
  }

  setData(data: readonly T[]): void {
    this._data.next(data);
    const maxPage = Math.max(0, Math.ceil(data.length / this.pageSize) - 1);
    if (this.pageIndex > maxPage) {
      this.paginar({ pageIndex: maxPage, pageSize: this.pageSize });
    }
  }

  paginar(state: PaginadorState): void {
    this._page.next(state);
  }

  connect(): Observable<T[]> {
    return combineLatest([this._data, this._page]).pipe(
      map(([data, page]) =>
        data.slice(
          page.pageIndex * page.pageSize,
          (page.pageIndex + 1) * page.pageSize,
        ),
      ),
    );
  }

  disconnect(): void {}
}
