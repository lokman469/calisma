import { securityService } from '../services/security';

export function withSecurity(WrappedComponent) {
  return function SecureComponent(props) {
    // Session kontrolü
    if (!securityService.validateSession()) {
      window.location.href = '/login';
      return null;
    }

    // Props'ları sanitize et
    const sanitizedProps = Object.keys(props).reduce((acc, key) => {
      acc[key] = securityService.sanitizeInput(props[key]);
      return acc;
    }, {});

    return <WrappedComponent {...sanitizedProps} />;
  };
}

// Güvenli route wrapper'ı
export function SecureRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        securityService.validateSession() ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
} 