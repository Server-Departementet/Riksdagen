# Scripts in package.json

`server` refers to the node server running the backend.

`Next` refers to the frontend Nextjs app.
<!-- Extra line to stop bad table behaviors -->
| Script                  | Description                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `yarn dev`              | The main dev command. Runs transpiled server code once and starts Next in development mode.                    |
| `yarn build`            | Transpile server code and build Next.                                                                          |
| `yarn start`            | Production server start. Run transpiled server code once and starts Next. Requires running `yarn build` first. |
| `yarn next:dev`         | Only runs Next. Will update on changes in the files.                                                           |
| `yarn next:build`       | Only builds Next.                                                                                              |
| `yarn next:start`       | Only starts Next (not the server!) in production mode.                                                         |
| `yarn server:dev`       | Transpile server code and run it once.                                                                         |
| `yarn server:dev:watch` | Runs native (TS) server code and reruns on file changes. Run with care in relation to DB and API calls.        |
| `yarn server:build`     | Transpile server code with production flags.                                                                   |
| `yarn server:start`     | Production run the pre-transpiled server code.                                                                 |
<!-- Extra line to stop bad table behaviors -->