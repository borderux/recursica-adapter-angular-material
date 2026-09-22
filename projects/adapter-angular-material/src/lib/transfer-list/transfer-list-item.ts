export interface RecursicaTransferListItem {
  value: string;
  label: string;
  group?: string;
}

/** `[source, target]` — a fixed two-element tuple, matching the reference's own `RecursicaTransferListData`. */
export type RecursicaTransferListData = [
  RecursicaTransferListItem[],
  RecursicaTransferListItem[],
];
