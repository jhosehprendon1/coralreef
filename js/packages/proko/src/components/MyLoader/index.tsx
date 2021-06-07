import React from "react"
import ContentLoader from "react-content-loader"

export const CardLoader = () => (
  <ContentLoader 
    speed={3}
    width={212}
    height={400}
    viewBox="0 0 230 400"
    backgroundColor="#0c0c0c"
    foregroundColor="#595959"
  >
    <rect x="9" y="0" rx="14" ry="14" width="212" height="200" /> 
    <circle cx="39" cy="256" r="15" /> 
    <rect x="24" y="211" rx="0" ry="0" width="73" height="21" /> 
    <rect x="24" y="285" rx="6" ry="6" width="44" height="25" /> 
    <rect x="9" y="320" rx="5" ry="5" width="212" height="54" /> 
  </ContentLoader>
)

export const ThreeDots = () => (
  <ContentLoader
    viewBox="0 0 212 200"
    height={200}
    width={212}
    backgroundColor="transparent"
    style={{
      width: "100%",
      margin: "auto",
    }}
  >
    <circle cx="86" cy="100" r="8" />
    <circle cx="106" cy="100" r="8" />
    <circle cx="126" cy="100" r="8" />
  </ContentLoader>
)
