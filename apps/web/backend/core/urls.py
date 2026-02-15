from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from test_app.models import TestNote

@csrf_exempt
def handle_notes(request):
    if request.method == "POST":
        data = json.loads(request.body)
        new_note = TestNote.objects.create(content=data.get("content"))
        return JsonResponse({"status": "Saved!", "id": new_note.id})
    
    # GET: Return all notes
    notes = list(TestNote.objects.values('content'))
    return JsonResponse(notes, safe=False)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/test/', lambda r: JsonResponse({"message": "Connected!"})), # Your existing test
    path('api/notes/', handle_notes), # New test endpoint
]