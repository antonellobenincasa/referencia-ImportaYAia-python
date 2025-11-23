from rest_framework import serializers
from .models import EmailTemplate, EmailCampaign, SocialMediaPost, LandingPage, LandingPageSubmission, InlandTransportRate


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class EmailCampaignSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = EmailCampaign
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'started_at', 'completed_at', 'total_recipients', 'emails_sent', 'emails_failed')


class SocialMediaPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaPost
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'published_at', 'external_post_id', 'external_post_url')


class LandingPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingPage
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'total_visits', 'total_submissions')


class LandingPageSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingPageSubmission
        fields = '__all__'
        read_only_fields = (
            'created_at', 'processed_at', 'created_lead', 'created_quote',
            'status', 'error_message', 'quote_validity_days'
        )
    
    def validate(self, data):
        if data.get('is_existing_customer'):
            if not data.get('existing_customer_ruc'):
                raise serializers.ValidationError({
                    'existing_customer_ruc': 'RUC es requerido para clientes existentes'
                })
        else:
            if data.get('is_company'):
                if not data.get('company_name'):
                    raise serializers.ValidationError({
                        'company_name': 'Razón Social es requerida para empresas'
                    })
                if not data.get('company_ruc'):
                    raise serializers.ValidationError({
                        'company_ruc': 'RUC es requerido para empresas'
                    })
            else:
                if not data.get('first_name') or not data.get('last_name'):
                    raise serializers.ValidationError({
                        'first_name': 'Nombres y apellidos son requeridos para personas'
                    })
        
        if data.get('is_dg_cargo') and not data.get('msds_document'):
            raise serializers.ValidationError({
                'msds_document': 'Documento MSDS es obligatorio para carga peligrosa'
            })
        
        transport_type = data.get('transport_type')
        
        if transport_type == 'air':
            if not data.get('airport_origin') or not data.get('airport_destination'):
                raise serializers.ValidationError({
                    'airport_origin': 'Aeropuerto de origen y destino son requeridos para transporte aéreo'
                })
        
        elif transport_type in ['ocean_lcl', 'ocean_fcl']:
            if not data.get('pol_port_of_lading') or not data.get('pod_port_of_discharge'):
                raise serializers.ValidationError({
                    'pol_port_of_lading': 'Puerto de embarque (POL) y descarga (POD) son requeridos para transporte marítimo'
                })
        
        if transport_type == 'ocean_fcl':
            if not data.get('container_type'):
                raise serializers.ValidationError({
                    'container_type': 'Tipo de contenedor es requerido para Ocean FCL'
                })
        
        if data.get('needs_insurance'):
            if not data.get('cargo_cif_value_usd'):
                raise serializers.ValidationError({
                    'cargo_cif_value_usd': 'Valor CIF de mercancía es requerido para calcular el seguro'
                })
        
        if data.get('needs_inland_transport'):
            # Para Ocean FCL: requiere campos individuales (city, street, street_number)
            # Para Air y Ocean LCL: solo requiere inland_transport_full_address
            if data.get('transport_type') == 'ocean_fcl':
                required_address_fields = {
                    'inland_transport_city': 'Ciudad de entrega',
                    'inland_transport_street': 'Calle',
                    'inland_transport_street_number': 'Número de calle'
                }
                
                missing_fields = []
                for field, label in required_address_fields.items():
                    if not data.get(field):
                        missing_fields.append(label)
                
                if missing_fields:
                    raise serializers.ValidationError({
                        'inland_transport_city': f'Los siguientes campos de dirección son requeridos para transporte terrestre: {", ".join(missing_fields)}'
                    })
            else:
                # Para Air y Ocean LCL: solo requiere inland_transport_full_address
                if not data.get('inland_transport_full_address'):
                    raise serializers.ValidationError({
                        'inland_transport_full_address': 'La dirección completa de entrega es requerida para transporte terrestre'
                    })
        
        return data


class LandingPageDistributeSerializer(serializers.Serializer):
    landing_page_id = serializers.IntegerField()
    channels = serializers.ListField(
        child=serializers.ChoiceField(choices=['email', 'whatsapp', 'telegram', 'facebook', 'instagram', 'tiktok']),
        min_length=1
    )
    segment_filter = serializers.JSONField(required=False, default=dict)
    custom_message = serializers.CharField(required=False, allow_blank=True)


class InlandTransportRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InlandTransportRate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
