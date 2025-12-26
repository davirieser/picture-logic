import React from 'react'

type P = { setPostBodyComponents: (elems: React.JSX.Element[]) => void };
export const onRenderBody = ({ setPostBodyComponents }: P) => {
  setPostBodyComponents([
    <script src="/z3-built.js"></script>
  ])
}
