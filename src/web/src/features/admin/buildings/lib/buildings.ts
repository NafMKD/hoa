import api, { handleApi } from "@/lib/api";
import type { Building, BuildingPaginatedResponse, UnitFormData } from "@/types/types";

export const fetchBuildings = async (
  page: string,
  perPage: string,
  search = ""
): Promise<BuildingPaginatedResponse> => {
  try {
    const res = await handleApi<BuildingPaginatedResponse>(
      api.get(`/v1/buildings?page=${page}&per_page=${perPage}&search=${search}`)
    );

    return {
      data: Array.isArray(res.data) ? res.data : [],
      meta: {
        current_page: res?.meta?.current_page ?? 1,
        per_page: res?.meta?.per_page ?? parseInt(perPage),
        total: res?.meta?.total ?? 0,
        last_page: res?.meta?.last_page ?? 1,
      },
    };
  } catch (err) {
    console.error("Failed to fetch buildings", err);
    return {
      data: [],
      meta: {
        current_page: 1,
        per_page: parseInt(perPage),
        total: 0,
        last_page: 1,
      },
    };
  }
};

export const fetchBuildingDetail = (buildingId: string) =>
  handleApi<Building>(api.get(`/v1/buildings/${buildingId}`));

export const createBuilding = (formData: FormData) =>
  handleApi<Building>(
    api.post("/v1/buildings", formData)
  );

export const updateBuilding = (buildingId: string | number, formData: FormData) =>
  handleApi<Building>(
    api.put(`/v1/buildings/${buildingId}`, formData)
  );

export const deleteBuilding = (buildingId: string | number) =>
  handleApi<void>(api.delete(`/v1/buildings/${buildingId}`));

export const fetchBuildingNames = async (): Promise<UnitFormData> => 
  handleApi<UnitFormData>(api.get("/v1/buildings/names/all"));

export const importBuildings = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return handleApi<{
    message?: string;
    failed?: Array<{ name: string; reason?: string } | string>;
  }>(
    api.post("/v1/import/buildings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );
};
  