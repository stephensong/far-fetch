/* eslint-disable jest/expect-expect */
import fetchMock from 'fetch-mock-jest';

import FarFetch, { FarFetchError } from '../src/far-fetch';

beforeEach(() => {
  fetchMock.mockClear();
});

describe('testing api calls', () => {
  const ff = new FarFetch();

  const requestHeaderTypes = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];

  const requestTest = async (type) => {
    fetchMock[type]('http://example.com/users', 200);

    const response = await ff[type]('http://example.com/users');

    expect(response.status).toEqual(200);
  };

  requestHeaderTypes.forEach((requestHeaderType) => {
    it(`should successfully do a ${requestHeaderType} request`, () => {
      requestTest(requestHeaderType.toLowerCase());
    });
  });
});

describe('testing data parameters', () => {
  const ff = new FarFetch();

  const queryStringTest = async (type) => {
    const data = { name: 'Bobby Big Boy', gender: 'Male', age: '5' };

    const params = new URLSearchParams(Object.entries(data));

    const URLWithParams = `http://example.com/users?${params}`;

    fetchMock[type](URLWithParams, 200);

    const response = await ff[type]('http://example.com/users', { data });

    expect(response.url).toEqual(URLWithParams);
  };

  const bodyParamsTest = async (type) => {
    const data = { name: 'Bobby Big Boy', gender: 'Male', age: 5 };

    fetchMock[type]('http://example.com/usersParams', 200);

    await ff[type]('http://example.com/usersParams', { data });

    const { body } = fetchMock.mock.calls[0][1];

    expect(JSON.parse(body)).toEqual(data);
  };

  const bodyVanillaTest = async (type) => {
    const data = { name: 'Bobby Big Boy', gender: 'Male', age: 5 };

    fetchMock[type]('http://example.com/usersBody', 200);

    await ff[type]('http://example.com/usersBody', {
      'Content-Type': 'application/json',
      body: JSON.stringify(data),
    });

    const { body } = fetchMock.mock.calls[0][1];

    expect(JSON.parse(body)).toEqual(data);
  };

  ['GET', 'HEAD', 'DELETE'].forEach((requestHeaderType) => {
    it(`should successfully do a ${requestHeaderType} request with data parameters`, () => {
      queryStringTest(requestHeaderType.toLowerCase());
    });
  });

  ['POST', 'PUT', 'PATCH'].forEach((requestHeaderType) => {
    it(`should successfully do a ${requestHeaderType} request with data parameters`, () => {
      bodyParamsTest(requestHeaderType.toLowerCase());
    });
  });

  ['POST', 'PUT', 'PATCH'].forEach((requestHeaderType) => {
    it(`should accept body property with a ${requestHeaderType} request`, () => {
      bodyVanillaTest(requestHeaderType.toLowerCase());
    });
  });
});

describe('testing upload', () => {
  const ff = new FarFetch();

  const requestHeaderTypes = ['POST', 'PUT', 'PATCH'];

  const uploadSingleFile = async (headerType) => {
    const file = new File(['foo'], 'foo.txt', {
      type: 'text/plain',
    });

    fetchMock[headerType]('http://example.com/upload', 200);

    await ff[headerType]('http://example.com/upload', { files: file });

    const bodyValues = fetchMock.mock.calls[0][1].body.values();

    const [fileInMock] = Array.from(bodyValues).flat();

    expect(fileInMock).toBe(file);
  };

  const uploadMultipleFiles = async (headerType) => {
    const files = [
      new File(['foo1'], 'foo1.txt', {
        type: 'text/plain',
      }),
      new File(['foo2'], 'foo2.png', {
        type: 'image/png',
      }),
    ];

    fetchMock[headerType]('http://example.com/uploadMultiple', 200);

    await ff[headerType]('http://example.com/uploadMultiple', { files });

    const bodyValues = fetchMock.mock.calls[0][1].body.values();

    const filesInMock = Array.from(bodyValues).flat();

    files.forEach((file, index) => {
      expect(filesInMock[index]).toBe(file);
    });
  };

  const uploadMultipleCatFiles = async (headerType) => {
    const files = {
      photos: [
        new File(['foo1'], 'foo1.png', {
          type: 'image/png',
        }),
        new File(['foo2'], 'foo2.jpg', {
          type: 'image/jpeg',
        }),
      ],
      videos: [
        new File(['foo1'], 'foo1.mp4', {
          type: 'video/mp4',
        }),
        new File(['foo2'], 'foo2.mp4', {
          type: 'video/mp4',
        }),
      ],
      document: new File(['foo'], 'foo.csv', {
        type: 'text/csv',
      }),
    };

    const { photos, videos, document } = files;

    const filesFlattened = Object.values(files).flat();

    fetchMock[headerType]('http://example.com/uploadMultipleCat', 200);

    await ff[headerType]('http://example.com/uploadMultipleCat', {
      files: { photos, videos, document },
    });

    const bodyValues = fetchMock.mock.calls[0][1].body.values();

    const filesInMock = Array.from(bodyValues).flat();

    filesFlattened.forEach((file, index) => {
      expect(filesInMock[index]).toBe(file);
    });
  };

  requestHeaderTypes.forEach((requestHeaderType) => {
    it(`should successfully upload a file with a ${requestHeaderType} request`, () => {
      uploadSingleFile(requestHeaderType.toLowerCase());
    });
  });

  requestHeaderTypes.forEach((requestHeaderType) => {
    it(`should successfully multiple files with a ${requestHeaderType} request`, () => {
      uploadMultipleFiles(requestHeaderType.toLowerCase());
    });
  });

  requestHeaderTypes.forEach((requestHeaderType) => {
    it(`should successfully upload multiple categories of files with a ${requestHeaderType} request`, () => {
      uploadMultipleCatFiles(requestHeaderType.toLowerCase());
    });
  });
});

describe('testing default options on instantiation', () => {
  it('should accept default options', async () => {
    const initOptions = {
      headers: {
        Authorization: 'Bearer kd9sj99jd9e',
      },
      cache: 'reload',
    };

    const ff = new FarFetch(initOptions);

    fetchMock.get('http://example.com/usersdd', 200);

    await ff.get('http://example.com/usersdd');

    initOptions.method = 'GET';

    expect(fetchMock.mock.calls[0][1]).toEqual(initOptions);
  });

  it('should set init options with setDefaultOptions()', async () => {
    const initOptions = {
      headers: {
        Authorization: 'Bearer',
      },
    };

    const ff = new FarFetch();

    ff.setDefaultOptions(initOptions);

    fetchMock.get('http://example.com/usersdgd', 200);

    await ff.get('http://example.com/usersdgd');

    initOptions.method = 'GET';

    expect(fetchMock.mock.calls[0][1]).toEqual(initOptions);
  });

  it('should NOT accept default options when defaultOptionsUsed is set to false', async () => {
    const initOptions = {
      headers: {
        Authorization: 'Bearer k9dsj99jd9e',
      },
      cache: 'reload',
    };

    const initOptionsComputed = {
      headers: {
        'Content-Type': 'text/xml',
      },
    };

    const computedOptionsMock = jest.fn(() => initOptionsComputed);

    const ff = new FarFetch({ ...initOptions, computedOptions: computedOptionsMock });

    fetchMock.get('http://example.com/usersoo', 200);

    await ff.get('http://example.com/usersoo', { defaultOptionsUsed: false });

    expect(fetchMock.mock.calls[0][1]).toEqual({ method: 'GET' });
  });

  it('should run errorHandler() hook function and accept { userMessage, error, response } parameters', async () => {
    const errorMsgNoun = 'user';

    const errorHandlerMock = jest.fn((paramObj) => paramObj);

    const ff = new FarFetch({ errorHandler: errorHandlerMock });

    const data = { name: 'Bobby Big Boy', gender: 'Male', age: 5 };

    fetchMock
      .post('http://example.com/usersddz', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        status: 400,
      });

    await expect(
      ff.post('http://example.com/usersddz', { errorMsgNoun: 'user' }),
    ).rejects.toThrow(FarFetchError);

    const { userMessage, error, response } = errorHandlerMock.mock.calls[0][0];

    expect(userMessage).toEqual(`Error adding ${errorMsgNoun}`);

    expect(error instanceof FarFetchError).toBe(true);

    expect(response.status).toEqual(400);

    expect(response.responseJSON).toEqual(data);
  });

  it(`should run errorHandler() hook function with errorMsg
  INSTEAD OF errorMsgNoun`, async () => {
    const errorHandlerMock = jest.fn();

    const ff = new FarFetch({ errorHandler: errorHandlerMock });

    fetchMock.get('http://example.com/usersddzq', 400);

    await expect(
      ff.get('http://example.com/usersddzq', {
        errorMsgNoun: 'user',
        errorMsg: 'Custom Message',
      }),
    ).rejects.toThrow(FarFetchError);

    const { userMessage } = errorHandlerMock.mock.calls[0][0];

    expect(errorHandlerMock).toHaveBeenCalled();

    expect(userMessage).toEqual('Custom Message');
  });

  it(`should throw FarFetchError and NOT run errorHandler() hook function 
  when globalErrorHandler is set to false`, async () => {
    const errorHandlerMock = jest.fn();

    const ff = new FarFetch({ errorHandler: errorHandlerMock });

    fetchMock.get('http://example.com/usersddza', 400);

    await expect(
      ff.get('http://example.com/usersddza', { globalErrorHandler: false }),
    ).rejects.toThrow(FarFetchError);

    expect(errorHandlerMock).not.toHaveBeenCalled();
  });

  it('should set custom error template with errorMsgTemplate()', async () => {
    const errorHandlerMock = jest.fn(({ userMessage }) => userMessage);

    const errorMessageTemplateMock = jest.fn(({ method, errorMsgNoun }) => {
      let message = '';

      if (method === 'GET') {
        message = `Violation with ${errorMsgNoun}`;
      }

      return message;
    });

    const ff = new FarFetch({
      errorHandler: errorHandlerMock,
      errorMsgTemplate: errorMessageTemplateMock,
    });

    fetchMock.get('http://example.com/usersddzzeeq', 400);

    await expect(
      ff.get('http://example.com/usersddzzeeq', { errorMsgNoun: 'user' }),
    ).rejects.toThrow(FarFetchError);

    const { value: userMessage } = errorHandlerMock.mock.results[0];

    expect(userMessage).toEqual('Violation with user');
  });

  it('should run beforeSend() hook function', async () => {
    const beforeSendMock = jest.fn();

    const ff = new FarFetch({ beforeSend: beforeSendMock });

    fetchMock.get('http://example.com/usersddzz', 200);

    await ff.get('http://example.com/usersddzz');

    expect(beforeSendMock).toHaveBeenCalled();
  });

  it('should NOT run beforeSend() hook function', async () => {
    const beforeSendMock = jest.fn();

    const ff = new FarFetch({ beforeSend: beforeSendMock });

    fetchMock.get('http://example.com/usersddzzee', 200);

    await ff.get('http://example.com/usersddzzee', { globalBeforeSend: false });

    expect(beforeSendMock).not.toHaveBeenCalled();
  });

  it('should run afterSend() hook function and accept response parameter', async () => {
    const afterSendMock = jest.fn((response) => response);

    const ff = new FarFetch({ afterSend: afterSendMock });

    fetchMock.get('http://example.com/usersddzzcc', 200);

    await ff.get('http://example.com/usersddzzcc');

    expect(afterSendMock).toHaveBeenCalled();

    const response = afterSendMock.mock.calls[0][0];

    expect(response.status).toEqual(200);
  });

  it('should NOT run afterSend() hook function', async () => {
    const afterSendMock = jest.fn();

    const ff = new FarFetch({ afterSend: afterSendMock });

    fetchMock.get('http://example.com/usersddzzccll', 200);

    await ff.get('http://example.com/usersddzzccll', { globalAfterSend: false });

    expect(afterSendMock).not.toHaveBeenCalled();
  });
});

describe('it should automatically transform response body, but allow manual as well', () => {
  it('should transform the response body to JSON if response header is JSON content-type, but still be able do it manually as well', async () => {
    const afterSendMock = jest.fn((response) => response);

    const ff = new FarFetch({ afterSend: afterSendMock });

    const data = { name: 'Bobby Big Boy', gender: 'Male', age: 5 };

    fetchMock.post('http://example.com/usersei', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const response = await ff.post('http://example.com/usersei', {
      headers: { 'Content-Type': 'application/json' },
      data,
    });

    const responseParam = afterSendMock.mock.calls[0][0];

    const responseJSONManualTransform = await response.json();

    expect(response.status).toEqual(200);

    expect(response.responseJSON).toEqual(data);

    expect(response.responseJSON).toEqual(responseJSONManualTransform);

    expect(response).toEqual(responseParam);
  });

  it('should transform the response body to text if response header is text content-type, but still be able do it manually as well', async () => {
    const afterSendMock = jest.fn((response) => response);

    const ff = new FarFetch({ afterSend: afterSendMock });

    const data = { name: 'Bobby Big Boy', gender: 'Male', age: 5 };

    fetchMock.post('http://example.com/userseir', {
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data),
    });

    const response = await ff.post('http://example.com/userseir', {
      headers: { 'Content-Type': 'text/plain' },
    });

    const responseParam = afterSendMock.mock.calls[0][0];

    const responseTextManualTransform = await response.text();

    expect(response.status).toEqual(200);

    expect(response.responseText).toEqual(JSON.stringify(data));

    expect(response.responseText).toEqual(responseTextManualTransform);

    expect(response).toEqual(responseParam);
  });
});
