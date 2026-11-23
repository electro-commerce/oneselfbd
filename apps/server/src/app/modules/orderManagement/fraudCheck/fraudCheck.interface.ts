type Report = {
  reportFrom: string;
  comment: string;
  date: string;
};

type Errors = {
  errorFrom?: string;
  message: string;
};

type Courier = {
  name: string;
  logo: string;
  orders: number | string;
  deliveries: number | string;
  cancellations: number | string;
  deliveryRate: number | string | null;
  volumeBand?: string | null;
  volumeRange?: string | null;
  deliveryRatio?: number | null;
  cancellationRatio?: number | null;
  doubtfulReports?: boolean;
};

type FormatFraudCheckData = {
  totalOrders: number;
  totalDeliveries: number;
  totalCancellations: number;
  deliveryRate?: number | null;
  couriers: Courier[];
  reports?: Report[];
  error?: boolean;
  errorFrom?: string;
  message?: string;
};

type FraudCheckData = {
  phoneNumber: string;
  totalOrders: number;
  totalDeliveries: number;
  totalCancellations: number;
  successRatio: number;
  message: string;
  couriers: Courier[];
  reports: Report[];
  errors: Errors[];
};

export { FraudCheckData, FormatFraudCheckData, Report, Errors, Courier };
