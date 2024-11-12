export function isVaildEmail(email: string) {
    const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    return emailRegex.test(email)
}

export function isVaildName(name: string) {
    return !/[|&;$%@"<>()+,'"]/.test(name);
}

export function timeDifference(time: Date) {
    return (new Date().getTime() - time.getTime()) / 60000;
}