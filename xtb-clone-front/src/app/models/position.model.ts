export interface Position {
  id: number;

  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;

  instrument: {
    id: number;
    symbol: string;
    name: string;
    type: string;
  };
}