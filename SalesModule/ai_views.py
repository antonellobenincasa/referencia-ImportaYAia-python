"""
AI API Views for AduanaExpertoIA module
"""
import logging
import base64
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

logger = logging.getLogger(__name__)


class AduanaChatView(APIView):
    """
    POST /api/ai/aduana-chat/
    Chat endpoint for AduanaExpertoIA with file attachment support
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def post(self, request):
        from .gemini_service import ai_assistant_chat
        import json
        
        message = request.data.get('message', '').strip()
        system_instruction = request.data.get('system_instruction', '')
        conversation_history_raw = request.data.get('conversation_history', '[]')
        
        try:
            conversation_history = json.loads(conversation_history_raw) if isinstance(conversation_history_raw, str) else conversation_history_raw
        except json.JSONDecodeError:
            conversation_history = []
        
        image_data = None
        image_mime_type = None
        
        for key in request.FILES:
            if key.startswith('attachment_'):
                file = request.FILES[key]
                try:
                    file_content = file.read()
                    image_data = base64.b64encode(file_content).decode('utf-8')
                    image_mime_type = file.content_type
                    
                    if image_mime_type == 'application/pdf':
                        pass
                    
                    break
                except Exception as e:
                    logger.error(f"Error processing attachment: {e}")
        
        if not message and not image_data:
            return Response({
                'error': 'Se requiere un mensaje o un archivo adjunto'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not message and image_data:
            message = "Analiza este documento y extrae la información relevante para importación a Ecuador."
        
        result = ai_assistant_chat(
            message=message,
            image_data=image_data,
            image_mime_type=image_mime_type
        )
        
        return Response(result)


class ClassifyProductView(APIView):
    """
    POST /api/ai/classify-product/
    Classify a product and suggest HS code
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .gemini_service import suggest_hs_code
        
        description = request.data.get('description', '').strip()
        origin_country = request.data.get('origin_country', '')
        fob_value = float(request.data.get('fob_value', 0))
        
        if not description:
            return Response({
                'error': 'Se requiere la descripción del producto'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = suggest_hs_code(
            product_description=description,
            origin_country=origin_country,
            fob_value=fob_value
        )
        
        return Response({
            'classification': result
        })
