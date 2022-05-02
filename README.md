# quicksend-server

`quicksend-server` is the backend to the open-source instant messaging app Quicksend, which
is still under development. This document contains information about the current state
of this repository, as well as as of yet unimplemented concepts.

## What already works

Currently, the following API routes are implemented:
- `/user`
  - `/create`: Creating new users
  - `/info`:   Get information about the authenticated user
- `/devices`
  - `/add`:    Add a new device for the authenticated user
  - `/remove`: Remove a device for the authenticated user
  - `/list`:   List all devices registered for the authenticated user

### Authentication

Apart from `/user/create`, authorization is required for all routes. In the case of
`/devices/add`, this is done via
[HTTP Basic authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization#basic),
in all other cases it is required to create a valid digital signature for a device previously
registered via `/devices/add`, in accordance with 
[this outdated IETF draft](https://tools.ietf.org/id/draft-cavage-http-signatures-12.html),
and as such with the `WWW-Authenticate` header sent by the server.


## Concepts

The following are ideas for the future of this project that are both vague and subject to change.

### Messages

Messages mean those that are sent from one user to another, and are
seperate from any medium in which they might be stored or via which they might be conveyed.

Messages should consist of two parts: the message headers and the message body, where the headers,
among other possible uses, tell the client how the body is to be interpreted. In order to be able
to send data of any (possibly binary) format, the following headers are
under consideration:

- `Type`:         the MIME type of the body content (default: `"text/plain"`)
- `Encoding`:     the encoding of the body content
  - valid values: `"utf-8"` (default), `"base64"`
- `Compression`:  the compression applided to the body after encoding
  - valid values: `"none"` (default), `"gzip"`

### Socket Server

Apart from the REST server, the quicksend-server process should start a seperate WebSocket server
process that keeps track of connected devices, and sends WebSocket messages to them by reading the
database.
