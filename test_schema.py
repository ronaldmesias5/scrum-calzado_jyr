import asyncio
import httpx

async def test_create_supply():
    payload = {
        "name": "Test Insumo",
        "category": "Corte",
        "color": "Rojo",
        "stock_quantity": 10,
        "sizes": {},
        "unit": "unidades",
        "description": "Test"
    }
    async with httpx.AsyncClient() as client:
        # Note: assuming backend runs on 8000, but is it running?
        # We can just test the Pydantic schema manually!
        pass

if __name__ == "__main__":
    import sys
    sys.path.append('c:\\scrum-calzado_jyr\\be')
    from app.modules.supplies.schemas import SupplyCreate, SupplyOut
    
    try:
        req = SupplyCreate(**payload)
        print("SupplyCreate parsed successfully:", req.model_dump())
    except Exception as e:
        print("SupplyCreate Error:", e)

    try:
        res = SupplyOut(**{
            "id": "12345678-1234-5678-1234-567812345678",
            "name": "Test",
            "description": "Desc",
            "category": "Corte",
            "color": "Rojo",
            "stock_quantity": 10,
            "sizes": {},
            "unit": "unidades",
            "created_at": "2026-04-12T20:00:00Z",
            "linked_products": []
        })
        print("SupplyOut parsed successfully:", res.model_dump())
    except Exception as e:
        print("SupplyOut Error:", e)

