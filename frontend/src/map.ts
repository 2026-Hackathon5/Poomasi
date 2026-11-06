
interface Window {
  kakao: {
    maps: {
      load: (callback: () => void) => void;

      LatLng: new (
        latitude: number,
        longitude: number
      ) => any;

      Map: new (
        container: HTMLElement,
        options: any
      ) => any;

      Marker: new (options: any) => any;

      CustomOverlay: new (options: any) => any;

      InfoWindow: new (options: any) => any;

      event: {
        addListener: (
          target: any,
          type: string,
          callback: () => void
        ) => void;
      };

      LatLngBounds: new () => any;

      Status: {
        ZERO_RESULT: string;
      };

      services: {
        Geocoder: new () => any;
        Places: new () => any;
      };
    };
  };
}
