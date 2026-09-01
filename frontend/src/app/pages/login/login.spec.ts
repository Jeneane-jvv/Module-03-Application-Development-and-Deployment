import {
  provideHttpClient,
} from '@angular/common/http';
import {
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  provideRouter,
} from '@angular/router';

import {
  Login,
} from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Login,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture =
      TestBed.createComponent(Login);

    component =
      fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });

  it('should hide the password by default', () => {
    expect(
      component.showPassword(),
    ).toBe(false);
  });

  it('should show the password when visibility is toggled', () => {
    component
      .togglePasswordVisibility();

    expect(
      component.showPassword(),
    ).toBe(true);
  });

  it('should hide the password when visibility is toggled twice', () => {
    component
      .togglePasswordVisibility();

    component
      .togglePasswordVisibility();

    expect(
      component.showPassword(),
    ).toBe(false);
  });
});
