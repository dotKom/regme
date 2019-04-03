import { Observable, Subject } from 'rxjs';

import { API_BASE, API_AUTH, CLIENT_SECRET, CLIENT_ID } from 'common/constants';

import { ServiceType } from 'services/ServiceType';


export const HttpService = new ServiceType("Http");


/*
 TODO: Fail all 401 requests if token can't be fetched
*/

export class HttpServiceProvider{

  constructor(dependencies, config) {
    // Request queue used for 503 and 401 responses
    this.requestQueue = [];
    this.auth_token = '';
    this.waitingForToken = false;
    this.requestSubject = new Subject();
    this.count = 0;
    // Subject for handling requests, each request is seperated by 100ms
    // Should be made for dynamic
    // Prevents 'DOS' protection
    this.requestSubject
      //Limit throughput by 100ms
      .concatMap(v => Observable.of(v).delay(100))
      // Subscrive to this stream
      .subscribe((requestPair) => {
        // preforme request
        this.count++;
        Observable.fromPromise(fetch(requestPair.request))
          /*
            Send response to handleResponse()
            handleResponse will resolve or will queue the request in case of
            401 error, when token is renewed it will then try to performe the request
          */
          .flatMap(response => this.handleResponse(response, requestPair.request))
          // When the request is resolved, send it back to the source of the request
          .subscribe((r) => {
            requestPair.subject.next(r);
          }, (error) => {
            requestPair.subject.error(error);
          }, () => {
            requestPair.subject.complete();
          });
      });
  }

  setToken(token){
    this.auth_token = token;
  }

  static getType(){
    return HttpService;
  }

  renewToken() {
    /*if (!this.waitingForToken) {
      this.waitingForToken = true;
      // Request new token
      this.post(`${API_BASE}${API_AUTH}`, {
        client_secret: CLIENT_SECRET,
        client_id: CLIENT_ID,
        grant_type: 'client_credentials',
      }, true)
        .subscribe((data) => {
          this.setToken(data.access_token);
          //this.auth_token = data.access_token;
          // Performe requests from request queue
          for (const i of this.requestQueue) {
            this.request(i.request).subscribe((r) => {
              i.subject.next(r);
            }, (error) => {
              i.subject.error(error);
            }, () => {
              i.subject.complete();
            });
          }
          this.requestQueue = [];
        }, (e) => {
          console.log('Error', e);
        }, () => {
        // Use a timeout to prevent a feedback loop
          setTimeout(() => {
            this.waitingForToken = false;
          }, 5000);
        });
    }*/
  }


  handleResponse(r, req) {
    /* TODO: handle 503(service unavailable) responses
      adjust delay up when a 503 responses happens
      and retry
    */
    if (!r.ok) {
      // 401 Unauthorized
      if (r.status == 401) {
        // Add request to queue
        const resolver = new Subject();
        this.requestQueue.push({ request: req, subject: resolver });
        // Renew token if not waiting for token, because access denied
        this.renewToken();
        return resolver.asObservable();
      }
      return Observable.throw(r);
    }
    return r.json();
  }
  /** Performs a general request
   * @param {Request} url
   * @return Observable<{}>
   */
  request(request) {
    // Add token to request
    request.headers.set('Authorization', `Bearer ${this.auth_token}`);
    const resolver = new Subject();
    // Push reqHttpServiceProvideruest into request 'stream'/queue
    this.requestSubject.next({ request, subject: resolver });
    return resolver.asObservable();
  }
  /** performes a get request
   * @param {string} url
   * @param {params} {key: value}
   * @return Observable<{}>
   */
  get(url, params) {
    let pUrl = url;
    if (params) {
      pUrl += HttpServiceProvider.urlEncode(params);
    }
    // Create request
    const request = new Request(pUrl, { method: 'get' });
    return this.request(request);
  }

  static urlEncode(data) {
    let ret = '';
    for (const key in data) {
      if (ret != '') {
        ret += '&';
      }
      ret += `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
    }
    return `?${ret}`;
  }
  /** Performs a post request
   * @param {string} url
   * @param {params} {key: value}
   * @param {boolean} url_encoded
   * @return Observable<{}>
   */
  post(url, body, url_encoded) {
    let pUrl = url;
    let pBody = body;
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (url_encoded) {
      pUrl += HttpServiceProvider.urlEncode(pBody);
      headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      pBody = null;
    } else {
      pBody = JSON.stringify(pBody);
    }
    // Create request
    const request = new Request(pUrl, {
      method: 'POST',
      body: pBody,
      headers,
    });
    return this.request(request);
  }
}
