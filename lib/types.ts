export interface Station {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  language: string;
  codec: string;
  bitrate: number;
  votes: number;
  geo_lat: number | null;
  geo_long: number | null;
}

export interface CountryOption {
  code: string;
  name: string;
  count: number;
}

export interface TagOption {
  name: string;
  count: number;
}

export interface StationFilters {
  name?: string;
  countrycode?: string;
  tag?: string;
}
