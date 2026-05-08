import asyncio
import traceback
from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from services.contract_generator import generate_contract_pdf
from services.attestation_generator import generate_attestation_formel_pdf
from services.facture_generator import generate_facture_pdf
from services.recu_generator import generate_recu_pdf

router = APIRouter()


class ClientDocRequest(BaseModel):
    sexe: Optional[str] = "M"
    prenom: Optional[str] = ""
    nom: Optional[str] = ""
    prenomAr: Optional[str] = ""
    nomAr: Optional[str] = ""
    numeroIdentite: Optional[str] = ""
    dateNaissance: Optional[str] = ""
    dateInscription: Optional[str] = ""
    dateContrat: Optional[str] = ""
    lieuNaissanceAr: Optional[str] = ""
    adresse: Optional[str] = ""
    adresseAr: Optional[str] = ""
    numDossier: Optional[str] = ""
    categorie: Optional[str] = "B"
    nomComplet: Optional[str] = ""
    montantTotal: Optional[float] = 0
    payments: Optional[List[Any]] = []


ContractRequest = ClientDocRequest


@router.post("/contrat-formation")
async def contrat_formation(body: ContractRequest):
    try:
        loop = asyncio.get_running_loop()
        pdf_bytes = await loop.run_in_executor(None, generate_contract_pdf, body.model_dump())
        nom = (body.nomComplet or "client").replace(" ", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="contrat_{nom}.pdf"'},
        )
    except Exception as e:
        detail = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)


@router.post("/attestation-formelle")
async def attestation_formelle(body: ClientDocRequest):
    try:
        loop = asyncio.get_running_loop()
        pdf_bytes = await loop.run_in_executor(None, generate_attestation_formel_pdf, body.model_dump())
        nom = (body.nomComplet or "client").replace(" ", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="attestation_{nom}.pdf"'},
        )
    except Exception as e:
        detail = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)


@router.post("/recu")
async def recu(body: ClientDocRequest):
    try:
        loop = asyncio.get_running_loop()
        pdf_bytes = await loop.run_in_executor(None, generate_recu_pdf, body.model_dump())
        nom = (body.nomComplet or "client").replace(" ", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="recu_{nom}.pdf"'},
        )
    except Exception as e:
        detail = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)


@router.post("/facture")
async def facture(body: ClientDocRequest):
    try:
        loop = asyncio.get_running_loop()
        pdf_bytes = await loop.run_in_executor(None, generate_facture_pdf, body.model_dump())
        nom = (body.nomComplet or f"{body.prenom} {body.nom}".strip() or "client").replace(" ", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="facture_{nom}.pdf"'},
        )
    except Exception as e:
        detail = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)
