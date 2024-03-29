import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { AuthData } from "./signup/auth-data-model";

@Injectable({providedIn: "root"})
export class AuthService {
  private isAuthenticated:any = false;
  private token: string;
  private tokenTimer: any;
  private userId: string;
  private useremail:string;
  private authStatusListener = new Subject<boolean>();
  private authEmailListener = new Subject<string>();
  constructor(private http: HttpClient, private router:Router) {}


  getToken() {
    return this.token;
  }

  getIsAuth() {
    return this.isAuthenticated;
  }
  getUserId() {
    return this.userId;
  }
  getUserEmail() {
    return this.useremail;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }
  getAuthEmailListener() {
    return this.authEmailListener.asObservable();
  }s
  createUser(email:string, password: string) {
    const authData: AuthData = {email:email, password:password};
    this.http.post("http://localhost:3000/api/users/signup", authData)
      .subscribe (response => {
        console.log(response);
        this.router.navigate(['/']);
      })
  }

  login(email: string, password: string) {
    const authData: AuthData = {email:email, password:password};
    this.http.post<{token: string, expiresIn: number, userId: string,useremail:string}>("http://localhost:3000/api/users/login",authData)
      .subscribe(response => {
        const token = response.token;
        this.token = token;
        if(token) {
          const expiresInDuration = response.expiresIn;
          this.setAuthTimer(expiresInDuration);
          console.log(expiresInDuration);
          this.isAuthenticated = true;
          this.userId = response.userId;
          this.useremail = response.useremail;
          this.authStatusListener.next(true);
          const now = new Date();
          const expirationDate = new Date(now.getTime() + expiresInDuration*1000);
          this.saveAuthData(token, expirationDate, this.userId);
          this.router.navigate(['/']);
        }

      })
  }

  autoAuthUser() {
    const authInformation = this.getAuthData();
    if(!authInformation) {
      return;
    }
    const now = new Date();
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    if(expiresIn > 0) {
      this.token = authInformation.token;
      this.isAuthenticated = true;
      this.userId = authInformation.userId;
      this.setAuthTimer(expiresIn /1000); //authtimer works with seconds
      this.authStatusListener.next(true);
    }

  }

  logout() {
    this.token =null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    this.userId = null;
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.router.navigate(['/']);

  }

  private setAuthTimer(duration:number) {
    console.log("Setting timer: " + duration);
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration*1000);
  }

  private saveAuthData(token: string, expirationDate: Date, userId:string) {
    localStorage.setItem("token", token);
    localStorage.setItem("expiration",expirationDate.toISOString());
    localStorage.setItem("userId", userId);
  }

  private clearAuthData() {
    localStorage.removeItem("token");
    localStorage.removeItem("expiration");
    localStorage.removeItem("userId");
  }
  private getAuthData():any {
    const token = localStorage.getItem("token");
    const expirationDate = localStorage.getItem("expiration");
    const userId = localStorage.getItem("userId");
    if( !token || !expirationDate) {
      return;
    }
    return {
      token:token,
      expirationDate: new Date(expirationDate),
      userId: userId
    }
  }
}
