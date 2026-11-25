export async function runLabApi(endpoint, { sample, file, file2, sample2, params = {} }) {
  let res;
  if (file || file2) {
    const fd = new FormData();
    if (file) fd.append("image", file);
    else if (sample) fd.append("sample", sample);

    if (file2) fd.append("image2", file2);
    else if (sample2) fd.append("sample2", sample2);

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    res = await fetch(endpoint, { method: "POST", body: fd });
  } else {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample, sample2, ...params }),
    });
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

