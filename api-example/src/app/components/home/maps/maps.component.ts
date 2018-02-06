import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import {UserService} from '../../../_services/user.service';

declare let google: any;

@Component({
  selector: 'app-map',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements OnInit {
  public map;
  private directionsService;
  private directionsDisplay;
  private markers: any[] = [];
  coordinate: any = {};
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  @ViewChild('coordinate.addressStart')
  addressStart;
  @ViewChild('coordinate.addressEnd')
  addressEnd;

  constructor(private _formBuilder: FormBuilder,
              private userService: UserService) {

  }

  ngOnInit() {
    this.mapInit();
    this.stepperInit();
  }

  stepperInit() {

    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required],
      firstCtrl2: ['', Validators.required]
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required]
    });
  }

  mapInit() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: {lat: 47.00989485019684, lng: 28.840969763696194}
    });

    this.map.addListener('click', e => {
      this.addNewMarker(e.latLng.lat(), e.latLng.lng());
    });
    return this.map;
  }

  setMapDirection(startPoint, endPoint) {

    this.directionsService = new google.maps.DirectionsService;
    this.directionsDisplay = new google.maps.DirectionsRenderer;
    this.directionsDisplay.setMap(this.mapInit());
    calculateAndDisplayRoute(this.directionsService, this.directionsDisplay);

    function calculateAndDisplayRoute(directionsService, directionsDisplay) {
      directionsService.route({
        origin: new google.maps.LatLng(parseFloat(startPoint[1]), parseFloat(startPoint[0])),
        destination: new google.maps.LatLng(parseFloat(endPoint[1]), parseFloat(endPoint[0])),
        travelMode: 'DRIVING'
      }, function (response, status) {
        if (status === 'OK') {
          directionsDisplay.setDirections(response);
        } else {
          window.alert('Error: ' + status);
        }
      });
    }
  }

  addNewMarker(lat, lng) {
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat, lng),
      map: this.map,
      animation: google.maps.Animation.BOUNCE
    });
    this.markers.push(marker);
    this.addAllMarkersOnMap(this.map);
    this.geocodePosition(marker)
      .subscribe(event => {
        //populate address start, end and coordinates start, end
        if (this.markers.length === 1) {
          this.coordinate.addressStart = event;
          this.addressStart.nativeElement.value = event;
          this.coordinate.coordinateStart = marker.getPosition().lng() + ':' + marker.getPosition().lat();

        } else {
          this.coordinate.addressEnd = event;
          this.addressEnd.nativeElement.value = event;
          this.coordinate.coordinateEnd = marker.getPosition().lng() + ':' + marker.getPosition().lat();
        }
      });
    if (this.markers.length > 1) {
      this.setMapDirection(
        [this.markers[0].getPosition().lng(), this.markers[0].getPosition().lat()],
        [this.markers[1].getPosition().lng(), this.markers[1].getPosition().lat()]);
      this.clearMarkers();
    }
  }

  addAllMarkersOnMap(map) {
    for (const m of this.markers) {
      m.setMap(map);
    }
  }

  clearMarkers() {
    this.addAllMarkersOnMap(null);
    this.markers = [];

  }

  geocodePosition(marker) {
    const geocoder = new google.maps.Geocoder();
    return Observable.create(observer => {
      geocoder.geocode({
        latLng: marker.getPosition()
      }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          observer.next(results[0].formatted_address);
          observer.complete();
        } else {
          console.log('Error - ', results, ' & Status - ', status);
          observer.next({});
          observer.complete();
        }
      });
    });
  }

  sendRequest() {
    this.coordinate.startTime = new Date().getTime();
    this.coordinate.endTime = this.coordinate.startTime + this.coordinate.lifeTime * 60 * 1000;
    this.userService.createCoordinate(this.coordinate)
      .subscribe(
        data => {
          console.log('Sent!');
        },
        error => {
          console.error(error.status);
        });

  }

}
