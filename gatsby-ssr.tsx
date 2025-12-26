import React from 'react'

type P = { setPostBodyComponents: (elems: React.JSX.Element[]) => void };
export const onRenderBody = ({ setPostBodyComponents }: P) => {
  setPostBodyComponents([
    // TODO: Copy z3-built.js and z3-built.wasm into static folder after build.
    // https://medium.com/@claudefournier/binairo-solution-with-react-and-z3-solver-76fab098a178
    <script src="/z3-built.js"></script>
  ])
}
