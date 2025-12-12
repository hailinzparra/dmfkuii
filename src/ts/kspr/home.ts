document.addEventListener('DOMContentLoaded', () => {
    const form = dom.q('#screening_form')! as HTMLFormElement
    const result_area = dom.q('#result_area')! as HTMLDivElement
    const current_year = new Date().getFullYear()

    const boolean_questions_data = [
        { id: 'stillbirth', label: '13. Saat ini bayi mati dalam kandungan', desc: '', weight: 4, is_emergency: false },
        { id: 'preeclampsia', label: '14. Preeklamsia dalam kehamilan ini', desc: 'Hipertensi + salah satu dari tanda-tanda berikut: proteinuria, bengkak pada muka/tungkai, nyeri kepala hebat, pandangan kabur.', weight: 4, is_emergency: false },
        { id: 'twins', label: '15. Saat ini hamil kembar 2 atau lebih', desc: '', weight: 4, is_emergency: false },
        { id: 'hydramnion', label: '16. Saat ini hamil kembar air (polihidramnion)', desc: '', weight: 4, is_emergency: false },
        { id: 'breech', label: '17. Saat ini letak sungsang', desc: '', weight: 8, is_emergency: true },
        { id: 'transverse', label: '18. Saat ini letak lintang', desc: '', weight: 8, is_emergency: true },
        { id: 'bleeding', label: '19. Perdarahan dalam kehamilan ini', desc: '', weight: 8, is_emergency: true },
        { id: 'severe_preeclampsia', label: '20. Preeklamsia berat/kejang-kejang dalam kehamilan ini', desc: '', weight: 8, is_emergency: true },
    ]

    const warning_icon = ' <span class="text-danger-emphasis" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Keadaan darurat obstetri"><i class="fa-solid fa-circle-exclamation"></i></span>'

    const render_boolean_questions = () => {
        const container = dom.q('#boolean_questions')! as HTMLDivElement
        container.innerHTML = boolean_questions_data.map((q, i) => {
            const desc = `<div class="text-muted small mb-2">${q.desc}</div>`
            return `<div class="${i > 0 ? 'mt-3' : ''}">
    <label class="form-label">${q.label}${q.is_emergency ? warning_icon : ''}</label>
    ${q.desc !== '' ? desc : ''}
    <div>
        <input type="radio" class="btn-check" name="${q.id}" value="ya"
            id="${q.id}_ya" autocomplete="off">
        <label class="btn btn-outline-danger" for="${q.id}_ya">Ya</label>
        <input type="radio" class="btn-check" name="${q.id}" value="tidak"
            id="${q.id}_tidak" autocomplete="off" checked>
        <label class="btn btn-outline-success" for="${q.id}_tidak">Tidak</label>
    </div>
</div>`
        }).join('')
        main.init_bs_tooltip()
    }

    render_boolean_questions()

    const input_gravida = dom.qe(form, '#gravida')! as HTMLInputElement
    const input_last_delivery_year = dom.qe(form, '#last_delivery_year')! as HTMLInputElement

    input_gravida.addEventListener('change', e => {
        const gravida = parseInt(input_gravida.value) || 0
        if (gravida < 2) {
            input_last_delivery_year.disabled = true
        }
        else {
            input_last_delivery_year.disabled = false
        }
    })

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
        const height = parseInt(data.height) || 0
        const gravida = parseInt(data.gravida) || 0
        const current_pregnancy_weeks = parseInt(data.current_pregnancy_weeks) || 0
        const marriage_year = parseInt(data.marriage_year) || 0
        const first_pregnancy_year = parseInt(data.first_pregnancy_year) || 0
        const last_delivery_year = parseInt(data.last_delivery_year) || 0

        problem_factors.push({ desc: 'Skor awal', added_score: 2, is_emergency: false })

        // Perkiraan usia ibu saat hamil pertama
        const age_at_first_pregnancy = age - (current_year - first_pregnancy_year)
        // 1. Terlalu muda (hamil pertama usia <= 16 tahun)
        if (age_at_first_pregnancy <= 16) {
            score += 4
            problem_factors.push({ desc: 'Terlalu muda, hamil pertama usia ≤ 16 tahun', added_score: 4, is_emergency: false })
        }
        // 2. Terlalu tua (hamil pertama usia >= 35 tahun)
        if (age_at_first_pregnancy >= 35) {
            score += 4
            problem_factors.push({ desc: 'Terlalu tua, hamil pertama usia ≥ 35 tahun', added_score: 4, is_emergency: false })
        }
        // 3. Terlalu lambat hamil (hamil pertama >= 4 tahun menikah)
        const years_to_first_pregnancy = first_pregnancy_year - marriage_year
        if (years_to_first_pregnancy >= 4) {
            score += 4
            problem_factors.push({ desc: 'Terlalu lambat hamil pertama (≥ 4 tahun setelah menikah)', added_score: 4, is_emergency: false })
        }
        // Perkiraan tahun kehamilan sekarang dimulai (digunakan untuk menghitung interval)
        const current_date = new Date()
        const days_in_a_week = 7
        const days_to_subtract = current_pregnancy_weeks * days_in_a_week
        const current_pregnancy_start_date = new Date(current_date)
        current_pregnancy_start_date.setDate(current_date.getDate() - days_to_subtract)
        const current_pregnancy_start_year = current_pregnancy_start_date.getFullYear()
        const interval = current_pregnancy_start_year - last_delivery_year
        // 4. Terlalu cepat hamil lagi (jarak < 2 tahun)
        if (gravida > 1 && last_delivery_year > 0 && interval < 2) {
            score += 4
            problem_factors.push({ desc: 'Terlalu cepat hamil lagi (jarak < 2 tahun)', added_score: 4, is_emergency: false })
        }
        // 5. Terlalu lama hamil lagi (jarak >= 10 tahun)
        if (gravida > 1 && last_delivery_year > 0 && interval >= 10) {
            score += 4
            problem_factors.push({ desc: 'Terlalu lama hamil lagi (jarak ≥ 10 tahun)', added_score: 4, is_emergency: false })
        }
        // 6. Terlalu banyak anak (4 / lebih)
        if (gravida >= 5) {
            score += 4
            problem_factors.push({ desc: 'Terlalu banyak anak (hamil ke-5 atau lebih)', added_score: 4, is_emergency: false })
        }
        // 7. Terlalu tua (usia >= 35 tahun)
        if (age >= 35) {
            score += 4
            problem_factors.push({ desc: 'Terlalu tua (usia ≥ 35 tahun)', added_score: 4, is_emergency: false })
        }
        // 8. Terlalu pendek (tinggi badan <= 145 cm)
        if (height <= 145) {
            score += 4
            problem_factors.push({ desc: 'Terlalu pendek (tinggi badan ≤ 145 cm)', added_score: 4, is_emergency: false })
        }
        // 9. Pernah gagal kehamilan
        if (data.history_failed_pregnancy === 'ya') {
            score += 4
            problem_factors.push({ desc: 'Pernah gagal kehamilan', added_score: 4, is_emergency: false })
        }
        // 10. Pernah melahirkan dengan... (+4 per opsi)
        (data.delivery_complications as string[]).forEach(complication => {
            score += 4
            problem_factors.push({ desc: `Pernah melahirkan dengan: ${complication}`, added_score: 4, is_emergency: true })
        })
        // 11. Punya penyakit dari pertanyaan 11 (+4 per opsi)
        const maternal_diseases: string[] = data.maternal_diseases || []
        for (const disease of maternal_diseases) {
            score += 4
            problem_factors.push({ desc: `Penyakit ibu hamil: ${disease}`, added_score: 4, is_emergency: false })
        }
        // 12. Kehamilan lebih bulan (>= 42 minggu)
        if (current_pregnancy_weeks >= 42) {
            score += 4
            problem_factors.push({ desc: 'Kehamilan lebih minggu (usia kehamilan ≥ 42 bulan)', added_score: 4, is_emergency: false })
        }
        // Pertanyaan Ya/Tidak dengan Skor 4
        boolean_questions_data.filter(q => q.weight === 4).forEach(q => {
            if (data[q.id] === 'ya') {
                score += q.weight
                problem_factors.push({ desc: q.label.replace(/^\d+\.\s*/, ''), added_score: q.weight, is_emergency: q.is_emergency })
                if (q.is_emergency) is_emergency_detected = true
            }
        })
        // 13. Pernah operasi sesar (+8)
        if (data.history_csection === 'ya') {
            score += 8
            problem_factors.push({ desc: 'Pernah operasi sesar', added_score: 8, is_emergency: true })
            is_emergency_detected = true
        }
        // Pertanyaan Ya/Tidak dengan Skor 8 (Semua ini adalah KATEGORI EMERGENSI)
        boolean_questions_data.filter(q => q.weight === 8).forEach(q => {
            if (data[q.id] === 'ya') {
                score += q.weight
                problem_factors.push({ desc: q.label.replace(/^\d+\.\s*/, ''), added_score: q.weight, is_emergency: q.is_emergency })
                if (q.is_emergency) is_emergency_detected = true
            }
        })

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
            color_class = 'warning'
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
                    <span class="badge text-bg-${color} rounded-pill">+${f.added_score}</span>
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
                    <span class="badge text-bg-${color_class} rounded-pill">${score}</span>
                </li>
            </ul>
        </div>
        <div class="card rounded-4">
            <div class="card-body">
                <h5><i class="fa-solid fa-notes-medical"></i> Rekomendasi Tindak Lanjut</h5>
                <div class="mb-2">${recommendation}</div>
                <div class="text-muted small fst-italic">Disclaimer: Alat ini adalah alat bantu skrining modifikasi KSPR. Konsultasikan hasil dan kondisi selalu dengan dokter spesialis kandungan atau bidan.</div>
                <div class="text-muted small fst-italic">Kategori: <span class="text-success-emphasis">KRR (Skor 2—5)</span>, <span class="text-warning-emphasis">KRT (Skor 6—11)</span>, <span class="text-danger-emphasis">KRST (Skor ≥12)</span></div>
            </div>
        </div>
    </div>
</div>`
        result_area.scrollIntoView({ behavior: 'smooth' })
    }
})
