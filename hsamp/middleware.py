from django.middleware.csrf import CsrfViewMiddleware


class CsrfExemptAPIMiddleware(CsrfViewMiddleware):
    """
    Custom CSRF middleware that exempts API endpoints.
    For SPA applications using JWT authentication, CSRF protection is not needed
    on API endpoints since tokens are sent via Authorization header, not cookies.
    """
    
    def _should_exempt(self, request):
        return request.path.startswith('/api/')
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        if self._should_exempt(request):
            return None
        return super().process_view(request, callback, callback_args, callback_kwargs)
