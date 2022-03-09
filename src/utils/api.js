import { get, isEmpty } from 'lodash';

function getDefaultHeaders() {
  let headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  return headers;
}

function handleResponse(response) {
  let contentType = response.headers.get("content-type");
  if (/json/i.test(contentType)) {
    return response.json().then((data) => {
      response.data = data;
      if (response.ok !== true) {
        if (get(response, "data.error_code")) {
          throw response.data;
        }
        if (get(response, "data.code") === "ECONNREFUSED") {
          throw response.data;
        }
        let error = Error();
        error.response = response;
        throw error;
      }

      return response;
    });
  } 
}


function getResource(endpoint, options = {}) {
  let query = get(options, "query")
  if(query) query = JSON.stringify(query)
  if(isEmpty(query) === false) endpoint += `?${query}`
  options = Object.assign({
    headers: getDefaultHeaders()
  }, options)

  return fetch(endpoint, options).then(handleResponse)
}

function postResource(endpoint, options = {}) {
  let query = get(options, "query");
  if (query) query = JSON.stringify(query);
  if (isEmpty(query) === false) endpoint += `?${query}`;
  options = Object.assign(
    {
      method: "POST",
      headers: getDefaultHeaders()
    },
    options
  );
  return fetch(endpoint, options).then(handleResponse);
}

function getListOfChocolates() {
  let endpoint = 'http://localhost:3001/api/items/chocolate-list';
  return getResource(endpoint);
}

function proceedPayment(options){
  let endpoint = 'http://localhost:3001/api/payment/process';
  return postResource(endpoint, options);
}

export {
  getListOfChocolates,
  proceedPayment
}