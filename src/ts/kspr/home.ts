document.addEventListener('DOMContentLoaded', () => {
    const form = dom.q('#screening_form')! as HTMLFormElement
    const result_area = dom.q('#result_area')! as HTMLDivElement
    const current_year = new Date().getFullYear()

    const boolean_questions_data = [
        { id: 'preeclampsia', label: '13. Bengkak pada muka/tungkai dan tekanan darah tinggi', is_emergency: false },
        { id: 'twins', label: '14. Hamil kembar 2 atau lebih', is_emergency: false },
        { id: 'hydramnion', label: '15. Hamil kembar air (Hydramnion)', is_emergency: false },
        { id: 'stillbirth', label: '16. Bayi mati dalam kandungan', is_emergency: false },
        { id: 'breech', label: '17. Letak sungsang', is_emergency: true },
        { id: 'transverse', label: '18. Letak lintang', is_emergency: true },
        { id: 'bleeding', label: '19. Perdarahan dalam kehamilan ini', is_emergency: true },
        { id: 'severe_preeclampsia', label: '20. Preeklamsia berat/kejang-kejang', is_emergency: true },
    ]

    const warning_icon = ' <span class="text-danger-emphasis" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Keadaan darurat obstetri"><i class="fa-solid fa-circle-exclamation"></i></span>'

    const render_boolean_questions = () => {
        const container = dom.q('#boolean_questions')! as HTMLDivElement
        container.innerHTML = boolean_questions_data.map((q, i) => `
<div class="${i > 0 ? 'mt-3' : ''}">
    <label class="form-label">${q.label}${q.is_emergency ? warning_icon : ''}</label>
    <div>
        <input type="radio" class="btn-check" name="${q.id}" value="ya"
            id="${q.id}_ya" autocomplete="off">
        <label class="btn btn-outline-danger" for="${q.id}_ya">Ya</label>
        <input type="radio" class="btn-check" name="${q.id}" value="tidak"
            id="${q.id}_tidak" autocomplete="off" checked>
        <label class="btn btn-outline-success" for="${q.id}_tidak">Tidak</label>
    </div>
</div>`).join('')
        main.init_bs_tooltip()
    }

    render_boolean_questions()

    form.addEventListener('submit', e => {
        e.preventDefault()
        calculate_risk_score()
    })

    const calculate_risk_score = () => {
        let score = 2
        const data: { [key: string]: any } = {}
        const problem_factors: { desc: string, added_score: number, is_emergency: boolean }[] = []
        let is_emergency_detected = false

        const form_data = new FormData(form)
        for (const [key, value] of form_data.entries()) {
            data[key] = value
        }

        // get checks
        data.delivery_complications = dom.get_input_check_value('delivery_complications')
        data.maternal_diseases = dom.get_input_check_value('maternal_diseases')

        // get numbs
        const age = parseInt(data.age) || 0
        const gravida = parseInt(data.gravida) || 0
        const current_pregnancy_months = parseInt(data.current_pregnancy_months) || 0
        const marriage_year = parseInt(data.marriage_year) || 0
        const first_pregnancy_year = parseInt(data.first_pregnancy_year) || 0
        const last_delivery_year = parseInt(data.last_delivery_year) || 0

        problem_factors.push({ desc: 'Skor Awal Kehamilan Risiko Rendah', added_score: 2, is_emergency: false })

        // // =================================================================
        // // A. Perhitungan Usia/Jarak Kehamilan & Faktor Risiko (+SKOR 4)
        // // =================================================================

        // // Perkiraan usia ibu saat hamil pertama
        // const ageAtFirstPregnancy = age - (currentYear - firstPregnancyYear);

        // // 1. Terlalu muda (hamil pertama usia <= 16 tahun)
        // if (ageAtFirstPregnancy <= 16) { score += 4; problem_factors.push({ description: 'Terlalu Muda Hamil Pertama (Usia ≤ 16 tahun)', addedScore: 4, isEmergency: false }); }

        // // 2. Terlalu tua (hamil pertama usia >= 35 tahun)
        // if (ageAtFirstPregnancy >= 35) { score += 4; problem_factors.push({ description: 'Terlalu Tua Hamil Pertama (Usia ≥ 35 tahun)', addedScore: 4, isEmergency: false }); }

        // // 3. Terlalu lambat hamil (hamil pertama >= 4 tahun menikah)
        // const yearsToFirstPregnancy = firstPregnancyYear - marriageYear;
        // if (yearsToFirstPregnancy >= 4) { score += 4; problem_factors.push({ description: 'Terlalu Lama Hamil (≥ 4 tahun setelah menikah)', addedScore: 4, isEmergency: false }); }

        // // Perkiraan tahun kehamilan sekarang dimulai (digunakan untuk menghitung interval)
        // const currentPregnancyStartYear = currentYear - Math.floor((currentPregnancyMonths - 1) / 12);
        // const interval = currentPregnancyStartYear - lastDeliveryYear;

        // // 4. Terlalu cepat hamil lagi (jarak < 2 tahun)
        // if (gravida > 1 && lastDeliveryYear > 0 && interval < 2) { score += 4; problem_factors.push({ description: 'Terlalu Cepat Hamil Lagi (Jarak < 2 tahun)', addedScore: 4, isEmergency: false }); }

        // // 5. Terlalu lama hamil lagi (jarak >= 10 tahun)
        // if (gravida > 1 && lastDeliveryYear > 0 && interval >= 10) { score += 4; problem_factors.push({ description: 'Terlalu Lama Hamil Lagi (Jarak ≥ 10 tahun)', addedScore: 4, isEmergency: false }); }

        // // 6. Terlalu banyak anak (4 / lebih)
        // if (gravida >= 5) { score += 4; problem_factors.push({ description: 'Terlalu Banyak Anak (Hamil ke-5 atau lebih)', addedScore: 4, isEmergency: false }); }

        // // 7. Terlalu tua (usia >= 35 tahun) - Usia saat ini
        // if (age >= 35) { score += 4; problem_factors.push({ description: 'Usia Ibu Saat Ini Terlalu Tua (≥ 35 tahun)', addedScore: 4, isEmergency: false }); }

        // // 8. Terlalu pendek (tinggi badan <= 145 cm)
        // if (data.height === '<=145') { score += 4; problem_factors.push({ description: 'Terlalu Pendek (Tinggi Badan ≤ 145 cm)', addedScore: 4, isEmergency: false }); }

        // // 9. Pernah gagal kehamilan
        // if (data.historyFailedPregnancy === 'ya') { score += 4; problem_factors.push({ description: 'Riwayat Gagal Kehamilan', addedScore: 4, isEmergency: false }); }

        // // 10. Pernah melahirkan dengan... (+4 per opsi). DITANDAI EMERGENSI
        // data.deliveryComplications.forEach(complication => {
        //     score += 4;
        //     is_emergency_detected = true; // Dianggap emergensi berdasarkan permintaan user
        //     problem_factors.push({ description: `Riwayat Melahirkan dengan Komplikasi (Q10): ${complication}`, addedScore: 4, isEmergency: true });
        // });

        // // 11. Punya penyakit dari pertanyaan 11 (+4 per opsi)
        // data.maternalDiseases.forEach(disease => {
        //     score += 4;
        //     problem_factors.push({ description: `Penyakit Ibu Hamil: ${disease}`, addedScore: 4, isEmergency: false });
        // });

        // // 12. Kehamilan lebih bulan (Asumsi > 10 bulan)
        // if (currentPregnancyMonths > 10) { score += 4; problem_factors.push({ description: 'Kehamilan Lebih Bulan (Usia kehamilan > 10 bulan)', addedScore: 4, isEmergency: false }); }

        // // Pertanyaan Ya/Tidak dengan Skor 4
        // booleanQuestionsData.filter(q => q.weight === 4).forEach(q => {
        //     if (data[q.id] === 'ya') {
        //         score += q.weight;
        //         const factor = { description: q.label.replace(/^\d+\.\s*/, ''), addedScore: q.weight, isEmergency: q.isEmergency };
        //         problem_factors.push(factor);
        //         if (q.isEmergency) is_emergency_detected = true;
        //     }
        // });

        // // =================================================================
        // // B. Perhitungan Risiko Sangat Tinggi (Semua +SKOR 8)
        // // =================================================================

        // // 13. Pernah operasi sesar (+8)
        // if (data.historyCSection === 'ya') { score += 8; problem_factors.push({ description: 'Riwayat Operasi Sesar', addedScore: 8, isEmergency: true }); is_emergency_detected = true; }

        // // Pertanyaan Ya/Tidak dengan Skor 8 (Semua ini adalah KATEGORI EMERGENSI)
        // booleanQuestionsData.filter(q => q.weight === 8).forEach(q => {
        //     if (data[q.id] === 'ya') {
        //         score += q.weight;
        //         const factor = { description: q.label.replace(/^\d+\.\s*/, ''), addedScore: q.weight, isEmergency: q.isEmergency };
        //         problem_factors.push(factor);
        //         if (q.isEmergency) is_emergency_detected = true;
        //     }
        // });

        let category = 'Kehamilan Risiko Rendah (KRR)'
        let recommendation = 'Risiko kehamilan pasien rendah. Tidak perlu rujuk. Persalinan bisa di rumah/polindes dengan penolong bidan.'
        let color_class = 'success'

        if (score >= 12) {
            category = 'Kehamilan Risiko Sangat Tinggi (KRST)'
            recommendation = 'Risiko kehamilan pasien SANGAT TINGGI. Pasien harus segera dirujuk ke rumah sakit. Persalinan di rumah sakit dengan penolong dokter.'
            color_class = 'danger'
        }
        else if (score >= 6) {
            category = 'Kehamilan Risiko Tinggi (KRT)'
            recommendation = 'Risiko kehamilan pasien tinggi. Pasien dapat dirujuk ke bidan atau puskesmas. Persalinan bisa di polindes/puskesmas/RS dengan penolong bidan/dokter.'
            color_class = 'danger'
        }

        display_result(
            data.name,
            age,
            score,
            category,
            recommendation,
            color_class,
            problem_factors,
            is_emergency_detected,
        )
    }

    const display_result = (
        name: string,
        age: number,
        score: number,
        category: string,
        recommendation: string,
        color_class: string,
        factors: { desc: string, added_score: number, is_emergency: boolean }[],
        is_emergency_detected: boolean,
    ) => {
        const emergency_card = `<div class="bg-danger text-white text-center p-4 rounded-4 animate-pulse mb-3">
    <span class="fs-5 fw-bold"><i class="fa-solid fa-triangle-exclamation"></i> PERINGATAN DARURAT OBSTETRI!</span>
    <div>Salah satu atau lebih keadaan darurat obstetri terdeteksi. SEGERA konsultasikan dengan dokter atau bidan.</div>
</div>`
        const factors_list = factors.map(f => {
            const color = f.added_score >= 8 ? 'danger' : f.added_score >= 4 ? 'warning' : 'success'
            return `<li class="list-group-item list-group-item-${color} d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">${f.desc}</div>
                    <span class="badge text-bg-${color} rounded-pill">+2</span>
                </li>`
        }).join('')

        result_area.innerHTML = `<hr />
<div class="card text-start mt-3 bg-${color_class}-subtle inner-shadow">
    <div class="card-body">
        <h3 class="card-title text-center text-${color_class}-emphasis">
            Hasil Skrining
        </h3>
        <div class="mt-3">
            <p>
                <span class="fw-bold">Nama:</span> ${name}
                <br />
                <span class="fw-bold">Usia:</span> ${age} tahun
            </p>
        </div>
        ${is_emergency_detected ? emergency_card : ''}
        <div class="bg-${color_class} text-${color_class}-emphasis text-center p-4 rounded-4 mb-3">
            <div class="fs-5 fw-bold mb-3">
                SKOR RISIKO TOTAL: ${score}<br />
                Kategori: ${category}
            </div>
            <ul class="list-group small">
                <li
                    class="list-group-item list-group-item-${color_class} d-flex justify-content-between align-items-start">
                    <span class="fw-bold"><i class="fa-solid fa-circle-info"></i> Detail Perhitungan Skor</span>
                </li>
                ${factors_list}
                <li
                    class="list-group-item list-group-item-${color_class} d-flex justify-content-between align-items-start fw-bold">
                    <div class="ms-2 me-auto">
                        Total Skor
                    </div>
                    <span class="badge text-bg-success rounded-pill">${score}</span>
                </li>
            </ul>
        </div>
        <div class="card rounded-4">
            <div class="card-body">
                <h5><i class="fa-solid fa-notes-medical"></i> Rekomendasi Tindak Lanjut</h5>
                <div class="mb-2">${recommendation}</div>
                <div class="text-muted small fst-italic">Disclaimer: Alat ini adalah alat bantu skrining. Konsultasikan hasil dan kondisi selalu dengan dokter spesialis kandungan atau bidan.</div>
            </div>
        </div>
    </div>
</div>`
        result_area.scrollIntoView({ behavior: 'smooth' })
    }
})
