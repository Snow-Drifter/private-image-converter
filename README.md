# Private Image Converter Website

Online image converter that does not send images to/from the server.
All conversions are done in the browser using web assembly.
Private and secure (and cheap to host)

## Setup

1. Install npm dependencies:
```bash
npm install
```

2. Run the server:
```bash
go run main.go
```

3. Open http://localhost:3000 in your browser

## Usage

Upload an image and a filename. A converted image will download if the input file can be converted into the target type.
