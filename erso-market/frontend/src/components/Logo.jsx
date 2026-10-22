// The ERSO logo (public/img/logo.png). BASE_URL keeps the path right on every page.
export default function Logo({ size = 28 }) {
  return <img className="logo-img" src={`${import.meta.env.BASE_URL}img/logo.png`} width={size} height={size} alt="" />;
}
