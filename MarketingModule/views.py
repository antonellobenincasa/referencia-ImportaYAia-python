from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import EmailTemplate, EmailCampaign, SocialMediaPost, LandingPage, LandingPageSubmission
from .serializers import (
    EmailTemplateSerializer, EmailCampaignSerializer, SocialMediaPostSerializer,
    LandingPageSerializer, LandingPageSubmissionSerializer, LandingPageDistributeSerializer
)
from SalesModule.models import Lead, Opportunity, Quote


class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'subject']


class EmailCampaignViewSet(viewsets.ModelViewSet):
    queryset = EmailCampaign.objects.all()
    serializer_class = EmailCampaignSerializer
    filterset_fields = ['status', 'template']
    search_fields = ['name']
    
    @action(detail=False, methods=['post'], url_path='send-mass-email')
    def send_mass_email(self, request):
        segment_filter = request.data.get('segment_filter', {})
        template_id = request.data.get('template_id')
        campaign_name = request.data.get('campaign_name', 'Campaña sin nombre')
        
        if not template_id:
            return Response({'error': 'template_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            template = EmailTemplate.objects.get(id=template_id)
        except EmailTemplate.DoesNotExist:
            return Response({'error': 'Plantilla no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        
        leads = Lead.objects.filter(**segment_filter)
        total_recipients = leads.count()
        
        campaign = EmailCampaign.objects.create(
            name=campaign_name,
            template=template,
            segment_filter=segment_filter,
            status='completada',
            started_at=timezone.now(),
            completed_at=timezone.now(),
            total_recipients=total_recipients,
            emails_sent=total_recipients,
            emails_failed=0
        )
        
        return Response({
            'message': f'Mock: {total_recipients} emails enviados exitosamente via SendGrid/Mailgun',
            'campaign_id': campaign.id,
            'total_recipients': total_recipients,
            'template_used': template.name
        }, status=status.HTTP_200_OK)


class SocialMediaPostViewSet(viewsets.ModelViewSet):
    queryset = SocialMediaPost.objects.all()
    serializer_class = SocialMediaPostSerializer
    filterset_fields = ['platform', 'status']
    search_fields = ['content', 'hashtags']
    
    @action(detail=True, methods=['post'], url_path='publish')
    def publish_post(self, request, pk=None):
        post = self.get_object()
        
        if post.status == 'publicado':
            return Response({'error': 'El post ya fue publicado'}, status=status.HTTP_400_BAD_REQUEST)
        
        post.status = 'publicado'
        post.published_at = timezone.now()
        post.external_post_id = f'mock_{post.platform}_{post.id}'
        post.external_post_url = f'https://{post.platform}.com/post/{post.id}'
        post.save()
        
        return Response({
            'message': f'Mock: Post publicado exitosamente en {post.platform}',
            'post_id': post.id,
            'platform': post.platform,
            'external_url': post.external_post_url
        }, status=status.HTTP_200_OK)


class LandingPageViewSet(viewsets.ModelViewSet):
    queryset = LandingPage.objects.all()
    serializer_class = LandingPageSerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'title']
    lookup_field = 'public_url_slug'
    
    @action(detail=True, methods=['post'], url_path='distribute')
    def distribute_landing_page(self, request, public_url_slug=None):
        landing_page = self.get_object()
        
        serializer = LandingPageDistributeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        channels = data['channels']
        segment_filter = data.get('segment_filter', {})
        custom_message = data.get('custom_message', '')
        
        leads = Lead.objects.filter(**segment_filter) if segment_filter else Lead.objects.all()
        total_recipients = leads.count()
        
        distribution_url = f"https://your-domain.com/landing/{landing_page.public_url_slug}"
        
        mock_results = {
            'landing_page_id': landing_page.id,
            'landing_page_url': distribution_url,
            'total_recipients': total_recipients,
            'channels_used': channels,
            'distribution_details': []
        }
        
        for channel in channels:
            if channel == 'email':
                mock_results['distribution_details'].append({
                    'channel': 'email',
                    'status': 'enviado',
                    'recipients': total_recipients,
                    'message': f'Mock: {total_recipients} emails enviados con enlace a landing page'
                })
            elif channel == 'whatsapp':
                mock_results['distribution_details'].append({
                    'channel': 'whatsapp',
                    'status': 'enviado',
                    'recipients': total_recipients,
                    'message': f'Mock: {total_recipients} mensajes WhatsApp enviados con enlace'
                })
            elif channel == 'telegram':
                mock_results['distribution_details'].append({
                    'channel': 'telegram',
                    'status': 'enviado',
                    'recipients': total_recipients,
                    'message': f'Mock: {total_recipients} mensajes Telegram enviados con enlace'
                })
            elif channel in ['facebook', 'instagram', 'tiktok']:
                mock_results['distribution_details'].append({
                    'channel': channel,
                    'status': 'publicado',
                    'message': f'Mock: Post con enlace a landing page publicado en {channel}'
                })
        
        return Response(mock_results, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path='stats')
    def get_stats(self, request, public_url_slug=None):
        landing_page = self.get_object()
        
        total_submissions = landing_page.submissions.count()
        pending_submissions = landing_page.submissions.filter(status='pendiente').count()
        processed_submissions = landing_page.submissions.filter(status='cotizado').count()
        failed_submissions = landing_page.submissions.filter(status='fallido').count()
        
        conversion_rate = (total_submissions / landing_page.total_visits * 100) if landing_page.total_visits > 0 else 0
        
        return Response({
            'landing_page': landing_page.name,
            'total_visits': landing_page.total_visits,
            'total_submissions': total_submissions,
            'pending_submissions': pending_submissions,
            'processed_submissions': processed_submissions,
            'failed_submissions': failed_submissions,
            'conversion_rate': f'{conversion_rate:.2f}%'
        })


class LandingPageSubmissionViewSet(viewsets.ModelViewSet):
    queryset = LandingPageSubmission.objects.all()
    serializer_class = LandingPageSubmissionSerializer
    filterset_fields = ['landing_page', 'status', 'transport_type', 'is_existing_customer']
    search_fields = ['company_name', 'first_name', 'last_name', 'email']
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        submission = serializer.save(
            submission_ip=self.get_client_ip(request),
            submission_source_channel=request.data.get('source_channel', 'web'),
            status='procesando'
        )
        
        landing_page = submission.landing_page
        landing_page.total_submissions += 1
        landing_page.save()
        
        try:
            lead, quote, services_breakdown = self.process_submission(submission)
            submission.created_lead = lead
            submission.created_quote = quote
            submission.status = 'cotizado'
            submission.processed_at = timezone.now()
            submission.save()
            
            complementary_total, _ = self.calculate_complementary_services_with_breakdown(submission)
            
            response_data = {
                'message': 'Cotización creada y enviada exitosamente',
                'submission_id': submission.id,
                'lead_id': lead.id,
                'quote_id': quote.id,
                'quote_number': quote.quote_number,
                'quote_valid_until': quote.valid_until,
                'quote_total': str(quote.final_price),
                'freight_cost': str(quote.base_rate + quote.profit_margin),
                'complementary_services': services_breakdown if services_breakdown else [],
                'complementary_services_total': str(complementary_total)
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            submission.status = 'fallido'
            submission.error_message = str(e)
            submission.save()
            
            return Response({
                'error': 'Error al procesar la solicitud',
                'details': str(e),
                'submission_id': submission.id
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def process_submission(self, submission):
        if submission.is_existing_customer:
            lead = Lead.objects.filter(
                tax_id_ruc=submission.existing_customer_ruc
            ).first()
            
            if not lead:
                raise ValueError(f'Cliente con RUC {submission.existing_customer_ruc} no encontrado en CRM')
        else:
            if submission.is_company:
                lead_data = {
                    'company_name': submission.company_name,
                    'tax_id_ruc': submission.company_ruc,
                    'email': submission.email,
                    'phone': submission.phone,
                    'source': 'landing_page',
                    'status': 'nuevo',
                    'country': 'Ecuador'
                }
            else:
                lead_data = {
                    'company_name': f'{submission.first_name} {submission.last_name}',
                    'contact_name': f'{submission.first_name} {submission.last_name}',
                    'email': submission.email,
                    'phone': submission.phone,
                    'source': 'landing_page',
                    'status': 'nuevo',
                    'country': 'Ecuador'
                }
            
            lead = Lead.objects.create(**lead_data)
        
        opportunity = Opportunity.objects.create(
            lead=lead,
            opportunity_name=f'Cotización {submission.transport_type.upper()} - {lead.company_name}',
            stage='calificacion',
            estimated_value=Decimal('1000.00')
        )
        
        quote_validity_days, valid_until_date = self.calculate_quote_validity(
            submission.transport_type,
            submission.origin_region
        )
        
        submission.quote_validity_days = quote_validity_days
        submission.save()
        
        if submission.needs_inland_transport:
            full_address = self.build_full_address(submission)
            submission.inland_transport_full_address = full_address
            submission.save()
        
        cargo_description = self.build_cargo_description(submission)
        
        base_rate = Decimal('500.00')
        profit_margin = Decimal('200.00')
        freight_subtotal = base_rate + profit_margin
        
        complementary_services_cost, services_breakdown = self.calculate_complementary_services_with_breakdown(submission)
        
        final_price = freight_subtotal + complementary_services_cost
        
        quote_notes = [f'Generado automáticamente desde landing page: {submission.landing_page.name}']
        quote_notes.append(f'\nFRETE: USD {freight_subtotal:.2f}')
        
        if complementary_services_cost > 0:
            quote_notes.append('\n--- SERVICIOS COMPLEMENTARIOS ---')
            for service_detail in services_breakdown:
                quote_notes.append(service_detail)
            quote_notes.append(f'SUBTOTAL SERVICIOS COMPLEMENTARIOS: USD {complementary_services_cost:.2f}')
            quote_notes.append(f'\nTOTAL COTIZACIÓN (SERVICIO INTEGRAL): USD {final_price:.2f}')
        else:
            quote_notes.append(f'\nTOTAL COTIZACIÓN: USD {final_price:.2f}')
        
        if submission.lead_comments:
            quote_notes.append(f'\n--- COMENTARIOS DEL CLIENTE ---')
            quote_notes.append(submission.lead_comments)
        
        quote = Quote.objects.create(
            opportunity=opportunity,
            origin=self.get_origin_location(submission),
            destination=self.get_destination_location(submission),
            incoterm=submission.incoterm,
            cargo_type=self.map_transport_to_cargo_type(submission.transport_type),
            cargo_description=cargo_description,
            base_rate=base_rate,
            profit_margin=profit_margin,
            final_price=final_price,
            valid_until=valid_until_date,
            notes='\n'.join(quote_notes),
            status='borrador'
        )
        
        return lead, quote, services_breakdown
    
    def calculate_quote_validity(self, transport_type, origin_region):
        now = timezone.now()
        
        if transport_type == 'air':
            validity_days = 7
            valid_until = now + timedelta(days=7)
        elif transport_type == 'ocean_lcl':
            if origin_region and ('asia' in origin_region.lower() or 'southeast' in origin_region.lower()):
                validity_days = 7
                valid_until = now + timedelta(days=7)
            else:
                last_day_of_month = (now.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                validity_days = (last_day_of_month - now).days
                valid_until = last_day_of_month
        elif transport_type == 'ocean_fcl':
            if origin_region and ('asia' in origin_region.lower() or 'southeast' in origin_region.lower()):
                validity_days = 7
                valid_until = now + timedelta(days=7)
            else:
                last_day_of_month = (now.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                validity_days = (last_day_of_month - now).days
                valid_until = last_day_of_month
        else:
            validity_days = 7
            valid_until = now + timedelta(days=7)
        
        return validity_days, valid_until
    
    def calculate_complementary_services_with_breakdown(self, submission):
        ECUADOR_TAX_RATE = Decimal('0.15')
        total_cost = Decimal('0.00')
        breakdown = []
        
        if submission.needs_customs_clearance:
            customs_base = Decimal('295.00')
            customs_tax = customs_base * ECUADOR_TAX_RATE
            customs_total = customs_base + customs_tax
            total_cost += customs_total
            breakdown.append(f'• Desaduanización: USD {customs_base:.2f} + IVA 15% (USD {customs_tax:.2f}) = USD {customs_total:.2f}')
        
        if submission.needs_insurance:
            if submission.cargo_cif_value_usd:
                insurance_rate = Decimal('0.0035')
                insurance_base = submission.cargo_cif_value_usd * insurance_rate
                
                minimum_insurance = Decimal('50.00')
                if insurance_base < minimum_insurance:
                    insurance_base = minimum_insurance
                    breakdown.append(f'• Seguro de Mercancía: USD {minimum_insurance:.2f} (mínimo) + IVA 15% (USD {minimum_insurance * ECUADOR_TAX_RATE:.2f}) = USD {minimum_insurance * (1 + ECUADOR_TAX_RATE):.2f}')
                else:
                    breakdown.append(f'• Seguro de Mercancía: 0.35% x USD {submission.cargo_cif_value_usd:.2f} = USD {insurance_base:.2f}')
                
                insurance_tax = insurance_base * ECUADOR_TAX_RATE
                insurance_total = insurance_base + insurance_tax
                if insurance_base >= minimum_insurance:
                    breakdown.append(f'  + IVA 15% (USD {insurance_tax:.2f}) = USD {insurance_total:.2f}')
                total_cost += insurance_total
        
        if submission.needs_inland_transport:
            breakdown.append(f'• Transporte Terrestre Interno a {submission.inland_transport_city}: Tarifa por definir')
            breakdown.append(f'  Dirección: {submission.inland_transport_full_address}')
        
        return total_cost, breakdown
    
    def build_full_address(self, submission):
        address_parts = []
        
        if submission.inland_transport_street:
            address_parts.append(submission.inland_transport_street)
        
        if submission.inland_transport_street_number:
            address_parts.append(f'No. {submission.inland_transport_street_number}')
        
        if submission.inland_transport_city:
            address_parts.append(submission.inland_transport_city)
        
        if submission.inland_transport_zip_code:
            address_parts.append(f'CP {submission.inland_transport_zip_code}')
        
        address_parts.append('Ecuador')
        
        full_address = ', '.join(address_parts)
        
        if submission.inland_transport_references:
            full_address += f'\nReferencias: {submission.inland_transport_references}'
        
        return full_address
    
    def build_cargo_description(self, submission):
        description_parts = []
        
        description_parts.append(f'Tipo de transporte: {submission.get_transport_type_display()}')
        description_parts.append(f'Incoterm: {submission.incoterm}')
        
        if submission.is_dg_cargo:
            description_parts.append('CARGA PELIGROSA (DG) - MSDS adjunto')
        else:
            description_parts.append('Carga general')
        
        description_parts.append(f'Peso bruto: {submission.gross_weight_kg} KG')
        description_parts.append(f'Cantidad de piezas: {submission.pieces_quantity}')
        
        if submission.length and submission.width and submission.height:
            description_parts.append(
                f'Dimensiones: {submission.length} x {submission.width} x {submission.height} {submission.dimension_unit}'
            )
        
        if submission.total_cbm:
            description_parts.append(f'CBM Total: {submission.total_cbm} m³')
        
        description_parts.append(f'Apilable: {"Sí" if submission.is_stackable else "No"}')
        
        if submission.container_type:
            description_parts.append(f'Contenedor: {submission.get_container_type_display()}')
        
        if submission.pickup_address:
            description_parts.append(f'Dirección de recogida: {submission.pickup_address}')
        
        description_parts.append('\n--- SERVICIOS COMPLEMENTARIOS ---')
        
        ECUADOR_TAX_RATE = Decimal('0.15')
        
        if submission.needs_customs_clearance:
            customs_base = Decimal('295.00')
            customs_tax = customs_base * ECUADOR_TAX_RATE
            customs_total = customs_base + customs_tax
            description_parts.append(f'✓ Desaduanización: USD {customs_base:.2f} + IVA 15% = USD {customs_total:.2f}')
        
        if submission.needs_insurance:
            if submission.cargo_cif_value_usd:
                insurance_rate = Decimal('0.0035')
                insurance_base = submission.cargo_cif_value_usd * insurance_rate
                
                minimum_insurance = Decimal('50.00')
                if insurance_base < minimum_insurance:
                    insurance_base = minimum_insurance
                    description_parts.append(f'✓ Seguro de Mercancía: USD {minimum_insurance:.2f} (mínimo)')
                else:
                    description_parts.append(f'✓ Seguro de Mercancía: 0.35% x USD {submission.cargo_cif_value_usd:.2f} = USD {insurance_base:.2f}')
                
                insurance_tax = insurance_base * ECUADOR_TAX_RATE
                insurance_total = insurance_base + insurance_tax
                description_parts.append(f'  Total con IVA 15%: USD {insurance_total:.2f}')
        
        if submission.needs_inland_transport:
            description_parts.append(f'✓ Transporte Terrestre Interno a: {submission.inland_transport_city}')
            description_parts.append(f'  Dirección: {submission.inland_transport_full_address}')
            description_parts.append('  Tarifa: Por definir según ciudad y distancia')
        
        if submission.lead_comments:
            description_parts.append(f'\n--- COMENTARIOS DEL CLIENTE ---')
            description_parts.append(submission.lead_comments)
        
        return '\n'.join(description_parts)
    
    def get_origin_location(self, submission):
        if submission.transport_type == 'air':
            return submission.airport_origin
        else:
            return submission.pol_port_of_lading
    
    def get_destination_location(self, submission):
        if submission.transport_type == 'air':
            return submission.airport_destination
        else:
            return submission.pod_port_of_discharge
    
    def map_transport_to_cargo_type(self, transport_type):
        mapping = {
            'air': 'air_freight',
            'ocean_lcl': 'lcl',
            'ocean_fcl': 'fcl'
        }
        return mapping.get(transport_type, 'lcl')
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
