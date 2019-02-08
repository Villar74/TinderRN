"use strict";

import { AsyncStorage, Platform } from "react-native";
import moment from "moment";

function currentTime() {
  // current time in seconds
  return Math.floor(new Date().getTime() / 1000);
}

/**
 * Api with caching requests
 * Везде использую, почему бы и нет
 */
class Api {
  constructor() {
    this.apiBaseUrl = "https://jsonplaceholder.typicode.com";

    this.defaultNetworkTimeout = 30000; // 30 sec
    this.cacheTtl = 0; // no caching by default
  }

  cache(ttl) {
    this.cacheTtl = ttl;
    return this;
  }

  timeout(sec) {
    this.timeoutSec = sec;
    return this;
  }

  getImages(albumId) {
    return this._exec("GET", "/photos?limit=5&albumId=" + albumId);
  }

  _getCache(key, ttl) {
    if (ttl === 0) {
      return new Promise.reject(null);
    }
    return AsyncStorage.getItem(key)
      .then(item => {
        if (item !== null) {
          const _data = JSON.parse(item);
          if (
            _data.hasOwnProperty("expr") &&
            currentTime() < parseInt(_data.expr, 10)
          ) {
            console.trace("Result served from cache " + key);
            return _data.value;
          }
        }
        throw "missing cache data";
      })
      .catch(() => {
        throw "missing cache data";
      });
  }

  _setCache(key, value, ttl) {
    if (ttl > 0) {
      const data = {
        expr: currentTime() + ttl,
        value: value
      };
      return AsyncStorage.setItem(key, JSON.stringify(data));
    }
  }

  invalidateCache() {
    return new Promise((resolve, reject) => {
      AsyncStorage.getAllKeys()
        .then(keys => {
          let cacheKeys = keys.filter(key => {
            return key && key.startsWith("cache");
          });
          AsyncStorage.multiRemove(cacheKeys)
            .then(() => {
              resolve();
            })
            .catch(e => {
              reject(e);
            });
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  _exec(method, url, params, returnheaders, headers = {}) {
    const cacheKey = `cache${this.token}_${url}_${
      params ? JSON.stringify(params) : ""
    }`;
    const self = this;
    const ttl = this.cacheTtl;
    const timeout = this.timeoutSec
      ? this.timeoutSec * 1000
      : this.defaultNetworkTimeout;
    this.cacheTtl = 0;
    this.timeoutSec = 0;

    const cachePromise = this._getCache(cacheKey, ttl).catch(() => {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = timeout;
        xhr.onreadystatechange = () => {
          if (xhr.readyState === xhr.DONE) {
            try {
              var data;
              if (returnheaders == true) {
                data = [];
                data[0] = JSON.parse(xhr.responseText);
                data[1] = parseInt(
                  xhr.getResponseHeader("X-Pagination-Page-Count")
                );
              } else if (xhr.responseText && xhr.responseText.length > 0) {
                data = JSON.parse(xhr.responseText);
              }
            } catch (exception) {
              console.warn(exception, xhr.responseText);
              reject({
                status: 0,
                error: "Error"
              });
            }
            if (xhr.status === 200 || xhr.status === 201) {
              if (method == "GET") {
                self._setCache(cacheKey, data, ttl);
              }
              resolve(data);
            } else if (xhr.status === 204) {
              resolve();
            } else if (xhr.status === 422) {
              reject({
                status: xhr.status,
                error: self.errorSummary(data),
                data: data
              });
            } else if (xhr.status >= 400 && xhr.status < 500) {
              let message =
                data && data.hasOwnProperty("message") ? data.message : "Error";
              reject({ status: xhr.status, error: message, data: data });
            } else if (xhr.status >= 500 && xhr.status < 600) {
              let message =
                data && data.hasOwnProperty("message") ? data.message : "Error";
              reject({ status: xhr.status, error: message, data: data });
            } else if (xhr.status !== 0) {
              reject({
                status: xhr.status,
                error: xhr.responseText,
                data: data
              });
            } else {
              console.log("Response:", xhr.responseText);
              reject({ status: 0, error: "Error" });
            }
          }
        };
        xhr.open(method, self.apiBaseUrl + url);
        let defaultHeaders = {
          "Content-type": "application/json",
          "Accept-Language": "ru-RU",
          Accept: "application/json",
          "X-Auth-Token": "2620ce2ded7a440b811126670a54295e"
        };

        headers = Object.assign(defaultHeaders, headers);

        for (var key in headers) {
          if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
          }
        }
        console.trace("Executing: " + method + " " + url);

        xhr.send(JSON.stringify(params));
      });
    });
    return cachePromise;
  }
}

module.exports = new Api();
