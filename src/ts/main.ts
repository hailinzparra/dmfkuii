const main: {
    db: {
        ref(path?: string): FirebaseDatabase
    }
} = {
    db: {
        ref(path) {
            if (path) {
                path = path.replaceAll('.', '')
                    .replaceAll('#', '')
                    .replaceAll('$', '')
                    .replaceAll('[', '')
                    .replaceAll(']', '')
            }
            return firebase.database().ref(path)
        }
    }
}
